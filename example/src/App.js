import React, { useState } from 'react'
import VideoGatewayPlayer from 'video-gateway-player'
import 'video-gateway-player/dist/index.css'

const oniceconnectionstatechange = (state) => {
  console.log("onICEConnectionStateChange to=>", state)
}

const App = () => {
  const [suuid, setSuuid] = useState("demo1")
  return <>
    <VideoGatewayPlayer suuid={suuid}
      wsUrl={"ws://localhost:8085/ws"}
      oniceconnectionstatechange={oniceconnectionstatechange}
    />
    <button onClick={() => setSuuid(suuid == "demo2" ? 'demo1' : "demo2")} >CHANGE</button>
  </>
}

export default App
