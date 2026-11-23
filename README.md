# Phoenix Unlock plugins for Android

Target: Discord Phoenix 356.7 Alpha (version code 356207). Extract this archive before selecting files in https://mantikafasi.github.io/phoenix-unlock/.

| Patcher section | File | Behavior |
| --- | --- | --- |
| Plugin runtime → custom JS files | runtime/platform-indicators.js | Shows the devices and statuses Discord reports beside chat timestamps and on user profiles. |
| Frida gadget (advanced) → Frida scripts | frida/bluetooth-audio-fix.js | Skips the Discord audio router's request to enter Android communication mode. |
| Frida gadget (advanced) → Frida scripts | frida/file-size-on-picker.js | Labels local photo and video thumbnails when the picker supplies a media URI with a known size. Labels turn red at 25,000,000 bytes. |

Enable both sections in the patcher, select the files above, then build and install. If Phoenix already has Frida enabled, its floating JS panel can manage Frida scripts. Reopen Discord before testing and start a fresh call. Headset microphone availability and routing depend on the device.

Platform data appears when Discord delivers presence events. A blank indicator means no visible platform was reported. The size label describes the original local file, before any upload compression. Previously cached thumbnails may need to be reloaded. The thumbnail adapter checks the build number because the picker class names are specific to this APK.

## Verification

Checked the audio route and thumbnail method signatures against the 356207 Android bytecode. JavaScript syntax and mocked event, rendering and cleanup checks passed. Real-device behavior is unverified.

## References

- Valenced community catalog: https://community.valenced.app/
- Bluetooth Audio Fix by NoReplyUI5 and File Size on Picker by contrabags with Palm: https://github.com/Valenced/valenced-community-plugins
- Platform Indicators by Martinz64: https://github.com/Martinz64/vendetta-plugins/tree/master/plugins/PlatformIndicators
