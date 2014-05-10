var app = angular.module('ViradaCultural2014', [
  "ngRoute",
  "ngTouch",
  "mobile-angular-ui"
]);

angular.module('app', ['google-maps']);
app.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('/',  {
      templateUrl: "home.html", 
      controller:'Eventos'
  });
  $routeProvider.when('/evento/:id', {
      templateUrl: "evento.html", 
      controller:'Evento'
  }); 
  $routeProvider.when('/map', {
      templateUrl: "map.html", 
      controller:'MAPA'
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
console.log(Vevento[0]);

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

app.controller('Eventos', function($scope,$rootScope, $http, $filter) {
    if(Vlocal[0]==undefined ){
        $rootScope.loading = true;
        $http.get('assets/json/locais.json').then(function (value) {
            $http.get('assets/json/eventos.json').then(function (value2) { 
                Vevento = value2.data; $scope.dataEventos = Vevento; 
                Vlocal = value.data; $scope.dataLocais = Vlocal;
                 angular.forEach(Vevento, function(value, key){
                   Vevento[key].local= $filter('getById')(Vlocal, Vevento[key].spaceId);
                 });
                $rootScope.loading = false;
            });
        });
    } else {
        $scope.dataEventos = Vevento; 
        $scope.dataLocais = Vlocal; 
    }
}); 

app.controller('Evento', function($scope, $http,$rootScope, $routeParams, $filter) {
           $scope.Evento = $filter('getById')(Vevento, $routeParams.id);
$scope.markers = [];
        var mapOptions = {
        zoom: 15,
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
});



app.controller('MAPA', function($scope, $http,$rootScope, $routeParams, $filter) {
    var mapOptions = {
        zoom: 13,
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
            position: new google.maps.LatLng(info.local.location.latitude, info.local.location.longitude),
            title: info.city
        });
        marker.content = '<div class="infoWindowContent">' + info.startsAt + '</div>';
        
        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent('<small>' + info.name + '' + marker.content + '  <a  href="#/evento/'+info.id+'">Mais informações.</a></small>');
            infoWindow.open($scope.map, marker);
        });
        
        $scope.markers.push(marker);
        }catch(err) {}
        
    }  
    
    for (i = 0; i < Vevento.length; i++){
        createMarker(Vevento[i]);
    }

    $scope.openInfoWindow = function(e, selectedMarker){
        e.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    }    
});







