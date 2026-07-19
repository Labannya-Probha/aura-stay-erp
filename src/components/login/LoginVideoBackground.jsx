export default function LoginVideoBackground({
  brand,
  loading: _loading,
  videoReady,
  setVideoReady,
}) {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${brand.poster})` }}
      />

      {brand.video && (
        <video
          key={brand.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={brand.poster}
          onCanPlay={() => setVideoReady(true)}
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className={[
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            videoReady ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <source src={brand.video} type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-emerald-950/40" />
    </>
  )
}