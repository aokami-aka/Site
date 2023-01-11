new Vue({
    el: "#app",
    data() {
      return {
        audio: null,
        circleLeft: null,
        barWidth: null,
        duration: null,
        currentTime: null,
        isTimerPlaying: false,
        tracks: [
          {         // koori jousei
            artist: "Sakuma Takao",
            name: "Frozen Midnight",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/Koori%20Zokusei%20Danshi%20to%20Cool%20na%20Douryou%20Joshi.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Frozen_Midnight.mp3?raw=true",
            url: "https://open.spotify.com/track/3vI81nyW6KM3aFHld1BX6K?si=ea04e60cfa7d4af9",
          }, {        
            artist: "Nowlu",
            name: "Linaria",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/Koori%20Zokusei%20Danshi%20to%20Cool%20na%20Douryou%20Joshi_02.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/linaria.mp3?raw=true",
            url: "https://open.spotify.com/artist/0TAhk9VlgZqLcM4wn5nUpO?si=jsxklmVuTSKykKW7MkcvKA",
          },

          {         // revenger
            artist: "Retbear",
            name: "Down Timer",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/revenger.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/down_timer.mp3?raw=true",
            url: "https://open.spotify.com/artist/3rtNjlT8krol2X6iAuelYA?si=_7DyVPauThuZRLWeWeC1DQ",
          },

          {         // onimai
            artist: "Enako",
            name: "Identeitei Meltdown",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/oniichan.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Identeitei_Meltdown.mp3?raw=true",
            url: "https://open.spotify.com/artist/2jHLZmPoAmnlCswCMc8WCj?si=JTQfUrZ-S_CurZdDfixFHw",
          }, {         
            artist: "ONIMAI SISTERS",
            name: "Himegoto＊Crisisters",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/oniichan.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/HimegotoCrisisters.mp3?raw=true",
            url: "https://open.spotify.com/artist/3w1Hf6Gk9QBWQwXnjeSqjZ?si=wwbrc9i5ShqlvWK3Yat4jQ",
          },

          {         // otonari tenshi sama
            artist: "Ooishi Masayoshi",
            name: "Gift",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/otonari%20no%20tenshi.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/gift.mp3?raw=true",
            url: "https://open.spotify.com/artist/2NmgIfLAFl1DD1FZOY4YqC?si=uZeRExDMQpC4FfsPADVjDA",
          },

          {             // Trigun
            artist: "Kvi Baba",
            name: "Tombi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/trigun.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Tombi.mp3?raw=true",
            url: "https://open.spotify.com/artist/5VxQzcVrakID2E4UxaDPNs?si=f5gaQ-9hRKaWBSvUkaSMDQ",
          },

          {         // buddy daddies
            artist: "Ayase",
            name: "Shock!",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/buddy%20daddies.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Shock!.mp3?raw=true",
            url: "https://open.spotify.com/artist/1S8OQ9SqlLdD9l4paaZMuZ?si=rqX_VwA3Tg28zEKs8jhSGA",
          },

          {             // Nier
            artist: "Aimer",
            name: "escalate",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/nier%20automata.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/escarlate.mp3?raw=true",
            url: "https://open.spotify.com/artist/0bAsR2unSRpn6BQPEnNlZm?si=CTNYjx-fTmag8LuRi2mXrw",
          },

          {             // nokemono-tachi
            artist: "Ayana Taketatsu",
            name: "Ashita no Katachi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/nakemono-tachi.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/ashita_no_katachi.mp3?raw=true",
            url: "https://open.spotify.com/artist/34UBKoTrfN5mZ0qzJtsZSS?si=UoCALGZRQt2Mv9uwdx4elg",
          },

          {             // sikyou omniouji
            artist: "Angela",
            name: "Reconnection",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/saikyou%20onmyouji.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/reconnection.mp3?raw=true",
            url: "https://open.spotify.com/artist/2M1CLA7j3jwJNs1s90nzdL?si=FVG2NA9zSw6uZx3HVRJfGA",
          },

          {             // Mou Ippon
            artist: "Subway Daydream",
            name: "Stand By Me",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/mou%20ippon_02.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/stand_by_me.mp3?raw=true",
            url: "https://open.spotify.com/artist/4Iiidb9Wqw3kMFVEMxtEyf?si=CHsuXsy4Rw6mRF9lYp4stw",
          },

          {            // high card
            artist: "Five New Old",
            name: "Trickster",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/high%20card.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Trickster.mp3?raw=true",
            url: "https://open.spotify.com/track/4080qNZP4kWloqGH3ujVkp?si=f5ba7ec7a0d248cb",
          },

          {             // Mononogatari
            artist: "Arcana Project",
            name: "Koigoromo",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/mononogatari.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Koigoromo.mp3?raw=true",
            url: "https://open.spotify.com/artist/33nBmWfW7J3vL487uRL8Cz?si=5pgP_wNoRD6TCYqi6-a2hg",
          }, {             
            artist: "TRUE",
            name: "Rebind",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/mononogatari_02.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/rebind.mp3?raw=true",
            url: "https://open.spotify.com/artist/0UwVT0iMLLAa9SUNENg4te?si=lw6wtbcOR9irFRPfJxTX0Q",
          },

          {             // Kubo-san Wa Mob
            artist: "DIALOGUE+",
            name: "Kasuka de Tashika",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Estr%C3%A9ias/kubo-san_03.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Kasuka_de_Tashika.mp3?raw=true",
            url: "https://open.spotify.com/artist/2edEpSuGIPWwl7QJF3hXM0?si=uKcmHZ4vSHWfNyFDteZ7Qw",
          },

          {             // bungo stray dogs 4
            artist: "SCREEN mode",
            name: "True Story",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/bungo%20stray%20dogs.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Shirushi.mp3?raw=true",
            url: "https://open.spotify.com/artist/44CA4qMx5IOMDQOTg7G6KN?si=1cIOHF-VTXCXeq_l9kWX0g",
          }, {
            artist: "Luck Life",
            name: "Shirushi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/bungo%20stray%20dogs%204_03.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/True_Story.mp3?raw=true",
            url: "https://open.spotify.com/artist/35AeYLIKrorZDAxsb40vVZ?si=oEzSOSlnRKii09_I5huasg",
          },

          {             // tsurune 2
            artist: "Luck Life",
            name: "°C",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/tsurune%202.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/%C2%B0C.mp3?raw=true",
            url: "https://open.spotify.com/artist/35AeYLIKrorZDAxsb40vVZ?si=oEzSOSlnRKii09_I5huasg",
          }, {            
            artist: "Tei",
            name: "Hitomi Naka",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/tsurune%202_02.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/hitominaka.mp3?raw=true",
            url: "https://www.youtube.com/c/%E4%B8%81teihinoto",
          },

          {             // dungeon 4 - part 2
            artist: "Hayami Saori",
            name: "Shikou",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/dungeon%20ni%20deai%204_02.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/shikou.mp3?raw=true",
            url: "https://open.spotify.com/artist/32UDgij5Tm7EtyRRCC1JTN?si=JSPDO-lFSVWMqxs1hwkUAQ",
          },

          {             // nagatoro 2
            artist: "Sumire Uesaka",
            name: "LOVE CRAZY",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/nagatoro%202.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/love_crazy.mp3?raw=true",
            url: "https://open.spotify.com/artist/4hRg5l2hXQl3lAzffFF8P8?si=upsCz8msTwyv6K28cggpUA",
          }, {             
            artist: "Nagatoro-san",
            name: "MY SADISTIC ADOLESCENCE♡",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/nagatoro%202_02.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/my_sadistic_adolescence.webm?raw=true",
            url: "",
          },

          {             // kami-tachi 2
            artist: "MindaRyn",
            name: "Way to go",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/kami-tachi%202.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/way_to_go.mp3?raw=true",
            url: "https://open.spotify.com/artist/7MSns7VCEysJJhcp67gvtZ?si=anGApqRMQH-wnMSC-a73nw",
          }, {             
            artist: "Azusa Tadokoro",
            name: "Drum Shiki Tansaki",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/kami-tachi%202_02.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/Drum_Shiki_Tansaki.mp3?raw=true",
            url: "https://open.spotify.com/artist/6QA62pTldn4AF8DeKsKW0h?si=j3vpUsWnTDCBtRA0msKgbw",
          },

          {             // Tokyo Revenegers 2
            artist: "Official HIGE DANdism",
            name: "White Noise",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/tokyo%20revengers%202.jfif?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/white_noise.mp3?raw=true",
            url: "https://open.spotify.com/artist/5Vo1hnCRmCM6M4thZCInCj?si=oZCA6mAWQVGMLxlHV48SzQ",
          },

          {             // kyokou suiri 2
            artist: "KanoeRana",
            name: "Yotogibanashi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Continua%C3%A7%C3%B5es/kyoukou%20suiri_02.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2023/Janeiro2023/Music/yotogibanashi.mp3?raw=true",
            url: "https://open.spotify.com/artist/41xWPhTGTkBVZwftEX2Xft?si=4xgtRxAVQoeCWw-ifLZDwg",
          }

        ],
        currentTrack: null,
        currentTrackIndex: 0,
        transitionName: null
      };
    },
    methods: {
      play() {
        if (this.audio.paused) {
          this.audio.play();
          this.audio.volume = 0.25;
          this.isTimerPlaying = true;
        } else {
          this.audio.pause();
          this.isTimerPlaying = false;
        }
      },
      generateTime() {
        let width = (100 / this.audio.duration) * this.audio.currentTime;
        this.barWidth = width + "%";
        this.circleLeft = width + "%";
        let durmin = Math.floor(this.audio.duration / 60);
        let dursec = Math.floor(this.audio.duration - durmin * 60);
        let curmin = Math.floor(this.audio.currentTime / 60);
        let cursec = Math.floor(this.audio.currentTime - curmin * 60);
        if (durmin < 10) {
          durmin = "0" + durmin;
        }
        if (dursec < 10) {
          dursec = "0" + dursec;
        }
        if (curmin < 10) {
          curmin = "0" + curmin;
        }
        if (cursec < 10) {
          cursec = "0" + cursec;
        }
        this.duration = durmin + ":" + dursec;
        this.currentTime = curmin + ":" + cursec;
      },
      updateBar(x) {
        let progress = this.$refs.progress;
        let maxduration = this.audio.duration;
        let position = x - progress.offsetLeft;
        let percentage = (100 * position) / progress.offsetWidth;
        if (percentage > 100) {
          percentage = 100;
        }
        if (percentage < 0) {
          percentage = 0;
        }
        this.barWidth = percentage + "%";
        this.circleLeft = percentage + "%";
        this.audio.currentTime = (maxduration * percentage) / 100;
        this.audio.play();
      },
      clickProgress(e) {
        this.isTimerPlaying = true;
        this.audio.pause();
        this.updateBar(e.pageX);
      },
      prevTrack() {
        this.transitionName = "scale-in";
        this.isShowCover = false;
        if (this.currentTrackIndex > 0) {
          this.currentTrackIndex--;
        } else {
          this.currentTrackIndex = this.tracks.length - 1;
        }
        this.currentTrack = this.tracks[this.currentTrackIndex];
        this.resetPlayer();
      },
      nextTrack() {
        this.transitionName = "scale-out";
        this.isShowCover = false;
        if (this.currentTrackIndex < this.tracks.length - 1) {
          this.currentTrackIndex++;
        } else {
          this.currentTrackIndex = 0;
        }
        this.currentTrack = this.tracks[this.currentTrackIndex];
        this.resetPlayer();
      },
      resetPlayer() {
        this.barWidth = 0;
        this.circleLeft = 0;
        this.audio.currentTime = 0;
        this.audio.src = this.currentTrack.source;
        setTimeout(() => {
          if(this.isTimerPlaying) {
            this.audio.play();
          } else {
            this.audio.pause();
          }
        }, 300);
      },
      favorite() {
        this.tracks[this.currentTrackIndex].favorited = !this.tracks[
          this.currentTrackIndex
        ].favorited;
      }
    },
    created() {
      let vm = this;
      this.currentTrack = this.tracks[0];
      this.audio = new Audio();
      this.audio.src = this.currentTrack.source;
      this.audio.ontimeupdate = function() {
        vm.generateTime();
      };
      this.audio.onloadedmetadata = function() {
        vm.generateTime();
      };
      this.audio.onended = function() {
        vm.nextTrack();
        this.isTimerPlaying = true;
      };
  
      // this is optional (for preload covers)
      for (let index = 0; index < this.tracks.length; index++) {
        const element = this.tracks[index];
        let link = document.createElement('link');
        link.rel = "prefetch";
        link.href = element.cover;
        link.as = "image"
        document.head.appendChild(link)
      }
    }
  });
