// @description Prevent Discord from enabling communication mode on Android.
let active = true;
let modeSetter;
plugin.onUnload(() => {
  active = false;
  if (modeSetter) modeSetter.implementation = null;
});

Java.perform(() => {
  if (!active) return;
  const AudioManager = Java.use("android.media.AudioManager");
  const communication = AudioManager.MODE_IN_COMMUNICATION.value;
  modeSetter = AudioManager.setMode.overload("int");
  modeSetter.implementation = function (mode) {
    if (mode === communication) {
      const discordRoute = Java.backtrace({ limit: 24 }).frames.some(
        frame => frame.className === "com.discord.media.audio.route.AndroidAudioRouter"
      );
      if (discordRoute) return;
    }
    return modeSetter.call(this, mode);
  };
});
