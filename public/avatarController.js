// Avatar Controller Integration Layer
// This file provides a lightweight state machine for driving the WebGL / Unity avatar
// without requiring the full Unity project in this repository.
// If a Unity WebGL build is embedded and exposes `unityInstance`, we will forward
// animation trigger calls using `SendMessage` to a GameObject named `AvatarControllerRoot`.
// Otherwise we gracefully degrade and just log state changes.

(function(global){
  const state = {
    isTyping: false,
    isSpeaking: false,
    queuedOneShot: null,
    currentLoop: 'Sitting_Talking', // ambient default
    active: true,
    unityObject: 'AvatarControllerRoot',
    debug: true
  };

  const ONE_SHOTS = {
    victory: 'Sitting_Victory',
    bigVictory: 'Big_Victory',
    clap: 'Sitting_Clap',
    sitToType: 'Sit_To_Type',
    typeLoop: 'Typing',
    typeToSit: 'Type_To_Sit'
  };

  function log(...args){ if(state.debug) console.log('[Avatar]', ...args); }

  function sendToUnity(method, param){
    if(global.unityInstance && typeof global.unityInstance.SendMessage === 'function'){
      try { global.unityInstance.SendMessage(state.unityObject, method, param || ''); }
      catch(e){ console.warn('Unity SendMessage failed', method, param, e); }
    } else {
      log('Simulated ->', method, param);
    }
  }

  function playLoop(loopName){
    state.currentLoop = loopName;
    sendToUnity('PlayLoop', loopName);
  }

  function playOneShot(name, onComplete){
    sendToUnity('PlayOneShot', name);
    // Heuristic: assume one-shot lasts 2s; adjust if needed via a callback system later
    setTimeout(()=>{
      if(onComplete) onComplete();
      applyFallback();
    }, 2000);
  }

  function applyFallback(){
    if(state.isTyping){
      // Ensure we are in typing loop
      playLoop(ONE_SHOTS.typeLoop);
      return;
    }
    if(state.isSpeaking){
      playLoop('Sitting_Talking');
      return;
    }
    playLoop('Sitting_Talking');
  }

  const api = {
    setDebug(v){ state.debug = !!v; },
    startTyping(){
      if(state.isTyping) return;
      state.isTyping = true;
      state.isSpeaking = false; // cannot speak while typing
      playOneShot(ONE_SHOTS.sitToType, ()=>{
        playLoop(ONE_SHOTS.typeLoop);
      });
    },
    stopTyping(){
      if(!state.isTyping) return;
      state.isTyping = false;
      playOneShot(ONE_SHOTS.typeToSit, ()=>{
        applyFallback();
      });
    },
    startSpeaking(){
      if(state.isTyping){ api.stopTyping(); }
      state.isSpeaking = true;
      playLoop('Sitting_Talking');
    },
    stopSpeaking(){
      state.isSpeaking = false;
      applyFallback();
    },
    doVictory(){
      playOneShot(ONE_SHOTS.victory);
    },
    doBigVictory(){
      playOneShot(ONE_SHOTS.bigVictory);
    },
    doClap(){
      playOneShot(ONE_SHOTS.clap);
    },
    // Called when an AI message begins composing
    notifyAIComposeStart(){ api.startTyping(); },
    // Called when composition finished & we want to simulate speaking for a bit
    notifyAIComposeEnd(){
      api.stopTyping();
      api.startSpeaking();
      // Auto stop speaking after a delay (simulate TTS length heuristic)
      setTimeout(()=>{ api.stopSpeaking(); }, 4000);
    },
    // Keyword trigger helper for raw AI text
    scanAndTrigger(text){
      const lower = text.toLowerCase();
      if(/(thank you|thanks|appreciate)/.test(lower)){ api.doClap(); }
      if(/(congrat|well done|great job)/.test(lower)){ api.doClap(); }
      if(/(goodbye|see you|farewell)/.test(lower)){ api.doBigVictory(); }
      if(/(victory|success)/.test(lower)){ api.doVictory(); }
    }
  };

  global.AvatarController = api;
  log('AvatarController initialized');

})(window);
