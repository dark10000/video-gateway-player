import React, { useEffect } from 'react';
import $ from 'jquery';


const VideoGatewayPlayer = ({ suuid, wsUrl, oniceconnectionstatechange }) => {
  let ws, pc;
  useEffect(() => {
    ws = new WebSocket(wsUrl);
    let config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    pc = new RTCPeerConnection(config, {
      optional: [{ DtlsSrtpKeyAgreement: true }],
    });
    ws.onopen = function (evt) {
      //console.log("OPEN");
      pc.peerid = Math.random();
      console.log(pc);

      pc.onicecandidate = handleICECandidateEvent;
      pc.ontrack = handleTrackEvent;
      pc.onnegotiationneeded = handleNegotiationNeededEvent;
      pc.onremovetrack = handleRemoveTrackEvent;
      pc.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
      pc.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
      pc.onsignalingstatechange = handleSignalingStateChangeEvent;
      pc.addTransceiver("video", { direction: "sendrecv" });

      pc.ontrack = handleOnTrack;
    };
    ws.onclose = function (evt) {
      //console.log("CLOSE");
      ws = null;
    };
    ws.onmessage = function (evt) {
      //console.log("ON MESSAGE")
      var data = JSON.parse(evt.data);
      if (data.sdp) {
        // console.log("remote data sdp =>", data.sdp)
        document.getElementById("remoteSessionDescription").value = data.sdp;
        startSession();
      } else {
        //console.log("remote candidate=>", data);

        pc.addIceCandidate(
          data,
          function () {
            console.log("addIceCandidate OK");
          },
          function (error) {
            console.log("addIceCandidate error:" + error);
          }
        );
      }
    }
    ws.onerror = function (evt) {
      console.log("ERROR: " + JSON.stringify(evt.data));
    };
    const startSession = () => {
      let sd = document.getElementById("remoteSessionDescription").value;
      if (sd === "") {
        return console.log("Session Description must not be empty");
      }
      try {
        pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: sd })
        );
      } catch (e) {
        console.log("error=>", e);
      }
    };
    return () => { stopPlayer(); }
  }, [suuid])

  const pcClose = () => {
    pc.close();
  };

  function handleOnTrack(event) {
    console.log("ontrack=>", JSON.stringify(event));
    var parent = document.getElementById("remoteVideos");
    var child = parent.children[0];
    var el;
    if (child) {
      child.srcObject = event.streams[0];
    }
    else {
      el = document.createElement(event.track.kind);
      el.srcObject = event.streams[0];
      el.muted = true;
      el.autoplay = true;
      el.controls = true;
      el.width = 600;
      document.getElementById("remoteVideos").appendChild(el);
    }
  };

  function handleICECandidateEvent(event) {
    console.log("candidate event=>", event)
    if (event.candidate) {
      var data = {
        Candidate: event.candidate.candidate,
        SdpMid: event.candidate.sdpMid,
        SdpMLineIndex: event.candidate.sdpMLineIndex,
      }
      ws.send(JSON.stringify(data));
    }
  }

  function handleNegotiationNeededEvent() {
    console.log("handleNegotiationNeededEvent")
    pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false }).then(function (offer) {
      console.log("offer=>", offer)
      return pc.setLocalDescription(offer);
    })
      .then(function () {
        console.log("local description=>", pc.localDescription.sdp)
        var suuid = $('#suuid').val();
        var data = { Suuid: suuid, Data: pc.localDescription.sdp };
        ws.send(JSON.stringify(data));
        console.log("after send data to server")
      })
      .catch((e) => {
        console.log("error=>", e)
      });
  }
  function handleICEConnectionStateChangeEvent(event) {
    oniceconnectionstatechange(pc.iceConnectionState)
  };
  function handleICEGatheringStateChangeEvent(handleICEGatheringStateChangeEvent) {
    console.log("handleICEGatheringStateChangeEvent =>", handleICEGatheringStateChangeEvent)
  }

  function handleTrackEvent(event) {
    console.log("handleTrackEvent=>", event)
  }

  function handleRemoveTrackEvent(event) {
    console.log("handleRemoveTrackEvent=>", event)
  }

  function handleSignalingStateChangeEvent(event) {
    console.log("handleSignalingStateChangeEvent=>", event)
  }

  function stopPlayer() {
    var remoteVideo = document.getElementById('remoteVideos');
    console.log("remote video=>", remoteVideo)
    if (pc) {
      pc.ontrack = null;
      pc.onremovetrack = null;
      pc.onremovestream = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.onicegatheringstatechange = null;
      pc.onnegotiationneeded = null;
      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      }
      pc.close();
      pc = null;

      remoteVideo.removeAttribute("src");
      remoteVideo.removeAttribute("srcObject");
    }
  }

  return (
    <div>
      <h2 style={{ alignSelf: "center" }}>Play Stream</h2>
      <div>
        <input type="hidden" name="suuid" id="suuid" value={suuid} />
        <input type="hidden" id="localSessionDescription" readOnly={true} />
        <input type="hidden" id="remoteSessionDescription" />
        <div id="remoteVideos"></div>
        {/* <button onClick={getStreams}> Get Streams </button> */}
        <button onClick={pcClose}> Close Connection </button>
        <button onClick={stopPlayer}> Stop Player</button>
        <div id="div"></div>
      </div>
    </div>
  )
}

export default VideoGatewayPlayer;