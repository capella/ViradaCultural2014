var app = angular.module('ViradaCultural2014', [
  "ngRoute",
  "ngTouch",
  "mobile-angular-ui",
  "infinite-scroll"
]);

var lib = new localStorageDB("library", localStorage);
if( lib.isNew() ) {
    lib.createTable("favoritos", ["id","data"]);
    lib.commit();
}


document.addEventListener("deviceready", function() {
    // retrieve the DOM element that had the ng-app attribute
    var domElement = document.findByID('kkk');
    angular.bootstrap(domElement, "ViradaCultural2014");
}, false);


app.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('/',  {
      templateUrl: "views/home.html", 
      controller:'Eventos'
  });
  $routeProvider.when('/evento/:id', {
      templateUrl: "views/evento.html", 
      controller:'Evento'
  }); 
  $routeProvider.when('/map', {
      templateUrl: "views/map.html", 
      controller:'MAPA'
  }); 
  $routeProvider.when('/locais', {
      templateUrl: "views/locais.html", 
      controller:'Locais'
  }); 
  $routeProvider.when('/horarios/:idlocal', {
      templateUrl: "views/locais-eventos.html", 
      controller:'Horarios'
  }); 
  $routeProvider.when('/favoritos', {
      templateUrl: "views/favoritos.html", 
      controller:'Favoritos'
  }); 
  $routeProvider.when('/categorias', {
      templateUrl: "views/categoria.html", 
      controller:'Categorias'
  }); 
  $routeProvider.when('/cate/:idlocal', {
      templateUrl: "views/categoria-eventos.html", 
      controller:'Cate'
  }); 
});


app.controller('MainController', function($rootScope, $scope){
  $rootScope.$on("$routeChangeStart", function(){
    $rootScope.loading = true;
  });
  $rootScope.$on("$routeChangeSuccess", function(){
    $rootScope.loading = false;
  });    
});

var Vlocal = new Array();
var Vevento = new Array();

app.filter('getById', function() {
  return function(input, id) {
    var i=0, len=input.length;
    for (; i<len; i++) {
      if (+input[i].id == +id) {
        return input[i];
      }
    }
    return null;
  }
});


var categorias =  new Array();
app.controller('Eventos', function($scope,$rootScope, $http, $filter, $location, $anchorScroll) {
    $scope.pageSize = 15;
    if(Vlocal[0]==undefined ){
        $rootScope.loading = true;
        $http.get('assets/json/locais.json').then(function (value) {
            $http.get('assets/json/eventos.json').then(function (value2) { 
                Vevento = value2.data; $scope.dataEventos = Vevento; 
                Vlocal = value.data; $scope.dataLocais = Vlocal;
                 angular.forEach(Vevento, function(value, key){
                   Vevento[key].local= $filter('getById')(Vlocal, Vevento[key].spaceId);
                   Vevento[key].d = new Date(Vevento[key].startsOn);
                   categorias.push(Vevento[key].terms.tag[0]);
                 });
                $rootScope.loading = false;
                var unique = [];
                $.each(categorias, function(i, el){
                    if($.inArray(el, unique) === -1 && el != undefined && el !="") unique.push(el);
                });
                categorias =unique;
            });
        });
    } else {
        $scope.dataEventos = Vevento; 
        $scope.dataLocais = Vlocal;
        console.log($scope.query);

    }
    $scope.loadMore = function() {
        $scope.pageSize+=5;
    };
    $scope.navigator = navigator;
    
    
}); 


app.controller('Evento', function($scope, $http,$rootScope, $routeParams, $filter) {
           $scope.Evento = $filter('getById')(Vevento, $routeParams.id);
    try{
$scope.markers = [];
        var mapOptions = {
        zoom: 17,
        center: new google.maps.LatLng(($scope.Evento).local.location.latitude, ($scope.Evento).local.location.longitude)
    }
        console.log(($scope.Evento).local.location);

    $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        
        var marker = new google.maps.Marker({
            map: $scope.map,
            position: new google.maps.LatLng(($scope.Evento).local.location.latitude, ($scope.Evento).local.location.longitude),
            title: ($scope.Evento).local.name
        });
        
        $scope.markers.push(marker);
    $scope.navigator = navigator; 
        }catch(err) {}
    
    var favo = lib.query("favoritos", {id: $routeParams.id});

    if(favo[0] != undefined ){
        $scope.like=true;
    } else {
        $scope.like=false;
    }
    $scope.addf  = function() {
        var favo2 = lib.query("favoritos", {id: $routeParams.id});
        console.log(favo2[0]);
        if(favo2[0] != undefined){
            lib.deleteRows("favoritos", {id: $routeParams.id});
            lib.commit(); 
            $scope.like=false;
        } else {
             lib.insert("favoritos", {id: $routeParams.id, data: $scope.Evento});
            lib.commit(); 
             $scope.like=true;
        } 
    };
    lastid =$routeParams.id;
});



app.controller('MAPA', function($scope, $http,$rootScope, $routeParams, $filter) {
    var mapOptions = {
        zoom: 14,
        center: new google.maps.LatLng(-23.550717,-46.633574)
    }
    

    $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);

    $scope.markers = [];
    
    var infoWindow = new google.maps.InfoWindow();
    
    google.maps.event.addListener($scope.map, 'idle', function(){var bounds = $scope.map.getBounds();});
    
    var createMarker = function (info){
                console.log(info.name);

        try{
        var marker = new google.maps.Marker({
            map: $scope.map,
            position: new google.maps.LatLng(info.location.latitude, info.location.longitude),
            title: info.city
        });
        //marker.content = '<div class="infoWindowContent">' + info.startsAt + '</div>';
        
        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent('<small>' + info.name + '' + '<br>  <a  href="#/horarios/'+info.id+'">Veja os eventos.</a></small>');
            infoWindow.open($scope.map, marker);
        });
        
        $scope.markers.push(marker);
        }catch(err) {}
        
    }  
    
    for (i = 0; i < Vlocal.length; i++){
        createMarker(Vlocal[i]);
    }

    $scope.openInfoWindow = function(e, selectedMarker){
        e.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    } 
    
    $scope.navigator = navigator;
});

app.controller('Locais', function($scope,$rootScope, $http, $filter) {
    $scope.pageSize = 15;
    $scope.dataLocais = Vlocal;
    $scope.loadMore = function() {
        $scope.pageSize+=5;
    };
    $scope.navigator = navigator;
});


app.controller('Favoritos', function($scope,$rootScope, $http, $filter) {
    $scope.pageSize = 15;
    $scope.dataLocais = lib.query("favoritos");
    $scope.loadMore = function() {
        $scope.pageSize+=5;
    };
    $scope.navigator = navigator;
});


app.filter('idlocalFilter', [function(){
    return function(Eventos, myParam){
        var result = {};
        angular.forEach(Vevento, function(machine, key){
            if(machine.spaceId == (myParam)){
                result[key] = machine;
            }
        });
        return result;
    };
}]);

app.controller('Horarios', function($scope,$rootScope,  $routeParams, $filter) {
    $scope.pageSize = 15;
    $scope.dataLocais = Vlocal;
    $scope.dataEventos  = Vevento;
    $scope.idlocal = $routeParams.idlocal;
    $scope.loadMore = function() {
        $scope.pageSize+=5;
    };
    $scope.navigator = navigator;
}); 
 

document.addEventListener("backbutton", onBackKeyDown, false);

function onBackKeyDown($location, $window) {
    window.location.assign('#/');
}


app.controller('Categorias', function($scope,$rootScope, $http, $filter) {
    $scope.pageSize = 15;
    $scope.dataLocais =  categorias;
    $scope.loadMore = function() {
        $scope.pageSize+=5;
    };
    $scope.navigator = navigator;
});


app.filter('idcateFilter', [function(){
    return function(Eventos, myParam){
        var result = {};
        angular.forEach(Vevento, function(machine, key){
            if(machine.terms.tag[0] == (myParam)){
                result[key] = machine;
            }
        });
        return result;
    };
}]);

app.controller('Cate', function($scope,$rootScope,  $routeParams, $filter) {
    $scope.pageSize = 15;
    $scope.dataLocais = Vlocal;
    $scope.dataEventos  = Vevento;
    $scope.idlocal = $routeParams.idlocal;
    $scope.loadMore = function() {
        $scope.pageSize+=5;
    };
    $scope.navigator = navigator;
}); 
 








