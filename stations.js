// ═══════════════════════════════════════════
//  STATION DATABASE — VERIFIED STREAM URLs
//  Last audited: March 2026
//  Each station has primary + fallback URLs.
//  HLS streams (.m3u8) use native browser HLS
//  where supported (Safari, Edge) or fall back
//  to the mp3/aac alternate.
// ═══════════════════════════════════════════

const STATIONS = {
  us: [
    {
      call: 'WWOZ', name: 'New Orleans Jazz & Heritage Radio',
      loc: 'NEW ORLEANS, LA', tags: ['jazz', 'blues', 'world'], freq: '90.7 FM',
      desc: 'The Voice of New Orleans',
      streams: [
        'https://wwoz-sc.wwoz.org/wwoz-hi.mp3',
        'https://wwoz-sc.streamguys1.com/wwoz-hi.mp3',
      ]
    },
    {
      call: 'WMSE', name: 'Milwaukee School of Engineering Radio',
      loc: 'MILWAUKEE, WI', tags: ['eclectic', 'folk', 'jazz'], freq: '91.7 FM',
      desc: 'Independent Eclectic Broadcast',
      streams: [
        'https://wmse.streamguys1.com/wmselivemp3',
        'https://wmse.streamguys1.com/wmse.mp3',
        'https://wmse.streamguys1.com/wmse',
      ]
    },
    {
      call: 'WDCB', name: 'College of DuPage Public Radio',
      loc: 'GLEN ELLYN, IL', tags: ['jazz', 'blues'], freq: '90.9 FM',
      desc: 'Chicago Jazz & Blues',
      streams: [
        'https://wdcb-ice.streamguys1.com/wdcb128',
        'https://wdcb-ice.streamguys1.com/mobile-AAC',
      ]
    },
    {
      call: 'KEXP', name: 'KEXP Seattle',
      loc: 'SEATTLE, WA', tags: ['eclectic'], freq: '90.3 FM',
      desc: 'Where the Music Matters',
      streams: [
        'https://kexp.streamguys1.com/kexp160.aac',
        'https://kexp.streamguys1.com/kexp64.aac',
      ]
    },
    {
      call: 'WFMU', name: 'WFMU Free Form Radio',
      loc: 'JERSEY CITY, NJ', tags: ['eclectic'], freq: '91.1 FM',
      desc: "America's Most Renowned Freeform",
      streams: [
        'https://stream0.wfmu.org/freeform-128k',
        'https://stream1.wfmu.org/freeform-128k',
        'https://stream2.wfmu.org/freeform-128k',
        'https://stream3.wfmu.org/freeform-128k',
      ]
    },
    {
      call: 'KCSM', name: 'Jazz 91.1',
      loc: 'SAN MATEO, CA', tags: ['jazz'], freq: '91.1 FM',
      desc: 'Bay Area Jazz Station',
      streams: [
        'https://kcsm.streamguys1.com/kcsm128.mp3',
        'https://kcsm.streamguys1.com/kcsm128',
      ]
    },
    {
      call: 'KUTX', name: 'KUTX Austin',
      loc: 'AUSTIN, TX', tags: ['eclectic', 'folk'], freq: '98.9 FM',
      desc: "Austin's Music Station",
      streams: [
        'https://streams.kut.org/4428_192.mp3?aw_0_1st.playerid=kutx-free',
        'https://streams.kut.org/4428_56?aw_0_1st.playerid=kutx-free',
      ]
    },
    {
      call: 'WBGO', name: 'Jazz 88.3',
      loc: 'NEWARK, NJ', tags: ['jazz'], freq: '88.3 FM',
      desc: 'Newark Public Radio Jazz',
      streams: [
        'https://wbgo.streamguys1.com/wbgo128',
        'https://ais-sa8.cdnstream1.com/3629_128.mp3',
        'https://ais-sa8.cdnstream1.com/3629_64.aac',
      ]
    },
    {
      call: 'WEMU', name: 'WEMU Public Radio',
      loc: 'YPSILANTI, MI', tags: ['jazz', 'blues'], freq: '89.1 FM',
      desc: 'Jazz & Blues from Eastern Michigan',
      streams: [
        'https://wemu.streamguys1.com/wemu128',
      ]
    },
    {
      call: 'Jazz24', name: 'Jazz24',
      loc: 'TACOMA, WA', tags: ['jazz'], freq: 'ONLINE',
      desc: 'Pacific Public Radio — Jazz Classics & Contemporary',
      streams: [
        'https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1',
      ]
    },
    {
      call: 'OCTAVE', name: 'Octave Radio',
      loc: 'ONLINE', tags: ['jazz'], freq: 'ONLINE',
      desc: 'Hi-Fi Jazz & Acoustic',
      streams: [
        'https://octaveradio.streamguys1.com/octave128',
      ]
    },
    {
      call: 'WDNA', name: 'WDNA Miami Jazz',
      loc: 'MIAMI, FL', tags: ['jazz', 'world'], freq: '88.9 FM',
      desc: 'Miami Jazz & Latin Jazz',
      streams: [
        'https://wdna.streamguys1.com/wdna128',
      ]
    },
    {
      call: 'JC3', name: 'JC3 Radio',
      loc: 'LOCAL', tags: ['jazz'], freq: 'LOCAL',
      desc: 'Local Library Stream',
      nowPlayingUrl: 'https://radio.ravijankar.com/api/nowplaying/jc3_radio',
      streams: [
        'https://radio.ravijankar.com/listen/jc3_radio/radio.mp3',
      ]
    },
  ],
  intl: [
    {
      call: 'BBC R3', name: 'BBC Radio 3',
      loc: 'LONDON, UK', tags: ['classical', 'world'], freq: '90.2 FM',
      desc: 'Classical Jazz & Arts — BBC',
      streams: [
        'http://as-hls-ww-live.akamaized.net/pool_23461179/live/ww/bbc_radio_three/bbc_radio_three.isml/bbc_radio_three-audio%3d96000.norewind.m3u8',
        'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_three',
      ]
    },
    {
      call: 'FIP', name: 'FIP Radio France',
      loc: 'PARIS, FRANCE', tags: ['jazz', 'world', 'eclectic'], freq: '105.1 FM',
      desc: 'Radio France — Éclectique',
      streams: [
        'https://icecast.radiofrance.fr/fip-hifi.aac',
        'https://direct.fipradio.fr/live/fip-hifi.aac',
        'https://direct.fipradio.fr/live/fip-midfi.mp3',
      ]
    },
    {
      call: 'FIP JAZZ', name: 'FIP Radio — Jazz Channel',
      loc: 'PARIS, FRANCE', tags: ['jazz', 'world'], freq: 'ONLINE',
      desc: 'FIP Jazz — Radio France',
      streams: [
        'https://icecast.radiofrance.fr/fipjazz-hifi.aac',
        'https://direct.fipradio.fr/live/fipjazz-midfi.mp3',
      ]
    },
    {
      call: 'FIP MONDE', name: 'FIP Radio — World Music',
      loc: 'PARIS, FRANCE', tags: ['world', 'eclectic'], freq: 'ONLINE',
      desc: 'FIP World — Global Sounds',
      streams: [
        'https://icecast.radiofrance.fr/fipworld-hifi.aac',
        'https://direct.fipradio.fr/live/fipworld-midfi.mp3',
      ]
    },
    {
      call: 'ARTE R', name: 'ARTE Radio',
      loc: 'STRASBOURG, FRANCE', tags: ['eclectic', 'world'], freq: 'ONLINE',
      desc: 'Franco-German Arts Broadcasting',
      streams: [
        'https://artestandard.ice.infomaniak.ch/arte-standard-128.mp3',
      ]
    },
    {
      call: 'RTÉ lyric', name: 'RTÉ lyric fm',
      loc: 'LIMERICK, IRELAND', tags: ['classical'], freq: '96.0 FM',
      desc: "Ireland's Classical Station",
      streams: [
        'https://rtelyricfm.akamaized.net/audio/lyricfm/rtelyricfm_hi.m3u8',
        'https://rtelyricfm.akamaized.net/audio/lyricfm/rtelyricfm_lo.m3u8',
      ]
    },
    {
      call: 'SOMA/SA', name: 'SomaFM Secret Agent',
      loc: 'SAN FRANCISCO, CA', tags: ['world', 'eclectic'], freq: 'ONLINE',
      desc: 'Retro Spy Jazz & Bossa Nova',
      streams: [
        'https://ice6.somafm.com/secretagent-128-mp3',
        'https://ice4.somafm.com/secretagent-128-mp3',
        'https://ice2.somafm.com/secretagent-128-mp3',
      ]
    },
    {
      call: 'SOMA/GV', name: 'SomaFM Groove Salad',
      loc: 'SAN FRANCISCO, CA', tags: ['eclectic'], freq: 'ONLINE',
      desc: 'A Nicely Chilled Plate of Grooves',
      streams: [
        'https://ice6.somafm.com/groovesalad-128-mp3',
        'https://ice4.somafm.com/groovesalad-128-mp3',
        'https://ice2.somafm.com/groovesalad-128-mp3',
      ]
    },
    {
      call: 'TSF', name: 'TSF Jazz',
      loc: 'PARIS, FRANCE', tags: ['jazz'], freq: '89.9 FM',
      desc: 'Paris Jazz Radio',
      streams: [
        'https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3',
      ]
    },
    {
      call: 'RSJ', name: 'Radio Swiss Jazz',
      loc: 'ZÜRICH, SWITZERLAND', tags: ['jazz', 'blues'], freq: 'ONLINE',
      desc: 'Swiss Public Radio — Jazz, Soul & Blues',
      streams: [
        'https://stream.srg-ssr.ch/rsp/aacp_96.stream',
      ]
    },
    {
      call: 'LINN', name: 'Linn Jazz',
      loc: 'GLASGOW, UK', tags: ['jazz'], freq: 'ONLINE',
      desc: 'High Quality Jazz Classics — Linn Records',
      streams: [
        'https://radio.linnrecords.com/linn-jazz.mp3',
      ]
    },
  ]
};
