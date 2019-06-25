var stompClient = null;
var clientId = getRandomInt(1000, 10000);
var senderHandler = null;
var wsurl = (window.location.protocol == "https:" ? 'wss':'ws') + "://" + window.location.hostname +
      (window.location.port ? ":" + window.location.port : "") + '/ws-api';
var graphhopperAPI = "https://graphhopper.com/api/1/route?point=45.390625,40.608908&point=45.482638,34.281292&vehicle=car&locale=ru&key=482abf20-ed99-41be-a353-7dbb6249c9c9&points_encoded=false"
var routeArr = [];
var routeArrIndex = 0;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    } else {
        $("#conversation").hide();
    }
    $("#coordstable").html("");
}

function connectViaWebSocket() {
    stompClient = Stomp.client($("#wsurl").val());
    stompClientConn();
}

function stompClientConn() {
    stompClient.connect({}, (frame) => {
        setConnected(true);
        console.log("Connected: " + frame);
    });
}

function subscribe() {
    stompClient.subscribe('/topic/locations/' + $("#submitId").val(), function (LOC) {
        showCoords(LOC.body);
    });
}

function sendCoords() {

    var locationUri = "/messaging/locations/" + $("#clientId").val();

    $.getJSON(graphhopperAPI, function (data) {
        routeArr = data.paths[0].points.coordinates;
    });

    var LOCMsg = {
        messageType: "LOC",
        objectDescription: {
            id: $("#clientId").val(),
            type: "DRIVER"},
        coordinates: {
            timeStamp: new Date(),
            lon: 0.0,
            lat: 0.0}
    };

    senderHandler = setInterval(() => {
        routeArrIndex += 3;
        if (routeArrIndex < routeArr.length - 1) {
            LOCMsg.coordinates.timeStamp = new Date();
            LOCMsg.coordinates.lat = parseFloat(routeArr[routeArrIndex][1]);
            LOCMsg.coordinates.lon = parseFloat(routeArr[routeArrIndex][0]);
            stompClient.send(locationUri, {}, JSON.stringify(LOCMsg));
        }
    }, 30000);
}

function showCoords(message) {
    $("#coordstable").append("<tr><td>" + message + "</td></tr>");
}

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });

    $("#clientId").val(clientId);
    $("#wsurl").val(wsurl);

    $("#usewsnative").click(function () {
        connectViaWebSocket();
    });

    $("#send").click(function () {
        sendCoords();
    });

    $("#subscribe").click(function () {
        subscribe();
    });

});