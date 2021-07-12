const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

//Getting the username which was entered by the user on the homepage
let usernaam = localStorage.getItem("koala");
if(!usernaam){
  usernaam = "guest";
}

//Creating a peer element which represents the current user
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;

//Getting the user's audio and video
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);//Display video to yourself

    //when we join someone's room we will receive a call from them
    peer.on("call", (call) => {
      call.answer(stream); // Stream them our video/audio
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);//disply others' video
      });
    });

    //when a new user connects
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    //send a message using the enter key
    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    //when a new message is sent in the text chat, how it is displayed and added to the chat
    socket.on("createMessage", (msg, username) => {
      let li = document.createElement("li");
      if(username===usernaam){
        li.innerHTML = "Me: "+msg;
      }
      else{
        li.innerHTML = username+": "+msg;
      } 
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });
  });

peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

//When we first open the app, have us join a room
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, usernaam);
});

//the function which is called when a new user connects to the room 
const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
  // If they leave, remove their video
  call.on('close', () => {
    video.remove()
})
};

const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

//appends new video stream to the existing video grid and resizes the video tiles according to the number of users connected
  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

//The function that toggles users video stream on and off when the pause video button is pressed
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

//The function that prompts the confirmation message and redirects the user back to the homepage when the leave meeting button is pressed
function closeCurrentTab() {
  const conf = confirm("Are you sure, you want to leave the meeting?");
  if (conf == true) {
    window.location.href = `/..`;
  }
};

//The function that prompts the room id when the invite button is pressed
function sendinvite(){
  const conf = prompt("Copy Room ID", window.location.pathname.substr(1));
};

//The function that performs the mute and unmute function when the mute button is pressed
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

//setting the play button
const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

//setting the pause button
const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

//setting the unmute button
const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};

//setting the mute button
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
