var app = angular.module("wewatch");
var roomId;

app.controller("RoomsShowController", ["$scope", "$firebaseObject", "$firebaseAuth", "$routeParams", "$firebaseArray",
  function($scope, $firebaseObject, $firebaseAuth, $routeParams, $firebaseArray) {

  var FBURL = "https://burning-inferno-6004.firebaseio.com/room/";
  var player;
  var videoID = "";
  var done = false;
  var playerState = -1; //player has not started
  var playTime = 0;
  var roomId = $routeParams.roomId;
  var ref = new Firebase(FBURL + roomId);
  console.log('runningfor roomid', roomId);

  // $scope.$watch('data.state', function newStateChanged(newValue) {
  //   if (newValue == 1) {
  //     console.log('watching video');
  //     seek();
  //   } else {
  //     console.log('scope pausing video watch');
  //     stop();
  //   }
  // });

  // download the data into a local object
  var syncObject = $firebaseObject(ref);

  // synchronize the object with a three-way data binding
  // click on `index.html` above to see it used in the DOM!
  // It's actually saved back in the firebase database in real-time.
  syncObject.$bindTo($scope, "data");

  $scope.messages = $firebaseObject(ref);
  // add new items to the array
  // the message is automatically added to our Firebase database!
  $scope.addMessage = function(messages) {
    console.log('adding new message', $scope.messages);
    ref.push({username: $scope.name,text: $scope.newMessageText});
  };

  var auth = $firebaseAuth(ref);

  $scope.login = function() {
    $scope.authData = null;
    $scope.error = null;

    auth.$authAnonymously().then(function(authData) {
      $scope.authData = authData;
      console.log("User " + authData.uid + " is logged in with " + authData.provider);
    }).catch(function(error) {
      $scope.error = error;
      console.log("User is logged out");
    });
  };


  // pass param/username into authData
  // $scope.login = function() {
  //   console.log('login button work');
  //   ref.authAnonymously(function(error, authData) {
  //     if (error) {
  //       console.log("Login Failed!", error);
  //     } else {
  //       console.log("Authenticated successfully with payload:", authData);
  //     }
  //   }, {
  //     remember: "sessionOnly"
  //     }
  //   );
  // };

  // need to write a function to get the specific videoID, currently getting whole url
  ref.child("videoID").on("value", function(snapshot) {
    videoID = snapshot.val();
    $("#url").val("https://www.youtube.com/watch?v="+videoID);
    console.log('show me video id now', videoID);
    if (player) {
      player.loadVideoById(videoID);
    } else {
      onYouTubeIframeAPIReady();
    }
  });

  // get the player current state
  ref.child("state").on("value", function(snapshot) {
    playerState = snapshot.val();
    console.log("STATE: ", playerState);
  });

  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  function onYouTubeIframeAPIReady() {
    console.log('fired youtube iframe');
    ref.child("state").once("value", function(state){
      playerState = state.val();
      console.log('current video', playerState);
      player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: videoID,
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        },
      });
    });
  }

  function onPlayerReady(event) {
    seek();
    console.log('ready show me id', event.data);
  }

  function onPlayerStateChange(event) {
    var newState = event.data;
    console.log('changing current state', newState);
    ref.child("state").set(newState);
  }

  function stop() {
    console.log('stopped video');
    player.pauseVideo();
  }

  function seek() {
    console.log('seeking current state', playerState);
    if (playerState === 1) {
      ref.child("state").set(playerState);
      player.playVideo();
    } else {
      ref.child("state").set(playerState);
      console.log('seeking paused', playerState);
      player.pauseVideo();
    }
  }

  $scope.loadVideo = function(url) {
    url = $("#url").val();
    console.log('loading video', url);
    var match = /v=([A-Za-z0-9_-]*)*/g;
    var result = match.exec(url);
    if (result) {
      console.log("got result: ", result[1]);
        videoID = result[1];
        ref.child("videoTime").set(0);
        ref.child("videoID").set(videoID);
    } else {
      console.log("No result: ", result);
      player.loadPlaylist({list:url,listType:"search",index:0,suggestedQuality:"small"});
    }
  };
}]);
