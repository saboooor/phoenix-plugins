// @description Draw original file sizes on local media thumbnails in Phoenix 356207.
let active = true;
const installed = [];
plugin.onUnload(() => {
  active = false;
  for (const method of installed) method.implementation = null;
});

Java.perform(() => {
  if (!active) return;
  const app = Java.use("android.app.ActivityThread").currentApplication();
  if (!app) throw new Error("Application unavailable. Reload after Discord opens.");
  const info = app.getPackageManager().getPackageInfo(app.getPackageName(), 0);
  if (Number(info.getLongVersionCode().toString()) !== 356207)
    throw new Error("This thumbnail adapter requires Discord build 356207.");

  const picker = Java.use("com.discord.nativeapp.modules.ag");
  const media = Java.use("com.discord.nativeapp.modules.dg");
  const photo = picker.d.overload("android.content.Context", "java.lang.String", "int", "int");
  const frame = picker.e.overload("int", "android.content.Context", "java.lang.String");
  const Uri = Java.use("android.net.Uri");
  const Canvas = Java.use("android.graphics.Canvas");
  const Config = Java.use("android.graphics.Bitmap$Config");
  const Paint = Java.use("android.graphics.Paint");
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  function format(bytes) {
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return Number(bytes.toFixed(i ? 1 : 0)) + " " + units[i];
  }
  function decorate(bitmap, ctx, handle) {
    if (!bitmap) return bitmap;
    try {
      const value = media.h.value.get(handle);
      if (!value) return bitmap;
      const uri = Java.cast(value, Uri);
      const cursor = ctx.getContentResolver().query(uri, Java.array("java.lang.String", ["_size"]), null, null, null);
      if (!cursor) return bitmap;
      let bytes;
      try {
        if (!cursor.moveToFirst() || cursor.isNull(0)) return bitmap;
        bytes = Number(cursor.getLong(0).toString());
      } finally { cursor.close(); }
      if (!Number.isSafeInteger(bytes) || bytes < 0) return bitmap;
      const label = format(bytes);
      const copy = bitmap.copy(Config.ARGB_8888.value, true);
      if (!copy) return bitmap;
      const canvas = Canvas.$new(copy);
      const paint = Paint.$new(1);
      const side = Math.min(copy.getWidth(), copy.getHeight());
      const pad = Math.max(1, side * 0.025);
      const font = side * 0.105;
      paint.setTextSize(font);
      const width = paint.measureText.overload("java.lang.String").call(paint, label);
      // Center inside the square crop used for non-square media.
      const x = (copy.getWidth() - side) / 2 + pad;
      const y = (copy.getHeight() - side) / 2 + pad;
      paint.setColor(0xc9000000 | 0);
      const top = paint.ascent(), bottom = paint.descent();
      canvas.drawRoundRect.overload("float","float","float","float","float","float","android.graphics.Paint")
        .call(canvas, x, y, x + width + 2 * pad, y + bottom - top + 2 * pad, pad, pad, paint);
      paint.setColor(bytes >= 25000000 ? (0xffff9898 | 0) : -1);
      canvas.drawText.overload("java.lang.String","float","float","android.graphics.Paint")
        .call(canvas, label, x + pad, y + pad - top, paint);
      return copy;
    } catch (_) { return bitmap; }
  }
  photo.implementation = function (ctx, handle, w, h) {
    return decorate(photo.call(this, ctx, handle, w, h), ctx, handle);
  };
  installed.push(photo);
  frame.implementation = function (size, ctx, handle) {
    const image = frame.call(this, size, ctx, handle);
    return size <= 512 ? decorate(image, ctx, handle) : image;
  };
  installed.push(frame);
});
