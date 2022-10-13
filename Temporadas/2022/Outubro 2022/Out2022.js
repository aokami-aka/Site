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
          {         // Tensei Shitara Ken Deshita
            artist: "Kyoudan & The Akeboshi Rockets",
            name: "Tensei Shitara Ken deshita",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Tensei%20Shitara%20Ken%20Deshita.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Tensei%20shitara%20Ken%20Deshita%20.mp3?raw=true",
            url: "https://open.spotify.com/artist/5STm6pQxk2nHd7JVcQCBoa?si=2W03ZtdQRzuN28WJCpBzqg",
          },{     
            artist: "Maon Kurosaki",
            name: "more＜STRONGLY",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Tensei%20Shitara%20Ken%20Deshita_02.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/moreSTRONGLY.mp3?raw=true",
            url: "https://open.spotify.com/artist/4SLTgwsFXbomwbNjsAvs3E?si=kFDnabUuS2qJdzL3dRt1-g",
          },
          {     // Uchi no Shishou
            artist: "GARNiDELiA",
            name: "Genai Yuugi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Uchi%20no%20Shishou%20wa%20Shippo%20ga%20Nai.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Gen'ai%20Yuugi.mp3?raw=true",
            url: "https://open.spotify.com/artist/7MIbdLkqD1qQE35LSISIM6?si=vZVFJqBDRpGVtfmR0lbgEA",
          }, { 
            artist: "Hinano",
            name: "Virginia",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Uchi%20no%20Shishou%20wa%20Shippo%20ga%20Nai_03.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Virginia.mp3?raw=true",
            url: "https://open.spotify.com/artist/5YWTfW6V637AZqljGfrWoI?si=jf5vMS3BRCeBiJw1GSzVgg",

          },
          // {     // Kokyu no Karazu
          //   artist: "Ziyoou-vachi",
          //   name: "MYSTERIOUS",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Kokyu%20no%20Karasu.jpg?raw=true",
          //   source: "",
          //   url: "",
          // 
          {   
            artist: "krage",
            name: "Natsu no Yuki",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Kokyu%20no%20Karasu_02.png?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Natsu%20no%20Yuki.mp3?raw=true",
            url: "https://open.spotify.com/artist/35jRIUtWCUITFLfjhYwkFx?si=0dg4QciYQD2mjQn5jeMZEg",
          },
          {   // Mobile Suit Gundam: Suisei no Majo
            artist: "YOASOBI",
            name: "Shukufuku",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Mobile%20Suit%20Gundam%20Suisei%20no%20Majo.jfif?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/The_Blessing.mp3?raw=true",
            url: "https://open.spotify.com/artist/64tJ2EAv1R6UaZqc4iOCyj?si=7up_KnQaTQSdEH8OooAYIA",
          },{ // Mobile Suit Gundam: Suisei no Majo
            artist: "Shiyui",
            name: "Kimi yo Kedakaku Are",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Mobile%20Suit%20Gundam%20Suisei%20no%20Majo_01.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Kimiyo%20kedakakuare.mp3?raw=true",
            url: "https://open.spotify.com/track/0rlYL6IQIwLZwYIguyy3l0?si=70f4750a622c4a1e",
          },
          // {   // C danchi
          //   artist: "",
          //   name: "",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/C%20Danshi.jpg?raw=true",
          //   source: "",
          //   url: "",
          // },{   // C danchi
          //   artist: "",
          //   name: "",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/C%20Danshi_01.jpg?raw=true",
          //   source: "",
          //   url: "",
          // },
          // {     // Shinobi no itoki
          //   artist: "Humbreaders",
          //   name: "Hikari",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Shinobi%20no%20Ittoki.jpg?raw=true",
          //   source: "",
          //   url: "https://open.spotify.com/artist/32k7rSC70F3C7qif9Pgavi?si=Ht3bFjWnSoyVhW6xjtcD1Q",
          // }, {      
          //   artist: "hockrockb",
          //   name: "Oboetate",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Shinobi%20no%20Ittoki_02.jpg?raw=true",
          //   source: "",
          //   url: "https://open.spotify.com/artist/56pKIRNnzK6xCW508ohOo3?si=czUrIiVLT5aAz2gcZz3dKA",
          // },
          // {     // Do it yourself
          //   artist: "Katajou DIY-bu!!",
          //   name: "Dokidoki Idea wo Yoroshiku!",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/do%20it%20Yourself!.webp?raw=true",
          //   source: "",
          //   url: "",
          // }, {      
          //   artist: "Dubladores",
          //   name: "Tsuzuku Hanashi",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/do%20it%20Yourself!_01.png?raw=true",
          //   source: "",
          //   url: "",
          // },
          // {     // Blue Lock
          //   artist: "UNISON SQUARE GARDEN",
          //   name: "Chaos wo Kiwamaru",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/BLUELOCK.jpg?raw=true",
          //   source: "",
          //   url: "https://open.spotify.com/artist/449AEgfeOxqAuRn0uX6l3u?si=SkJZnzc8TpGW35z6OYWCXw",
          // }, {     
          //   artist: "Shingo Nakamura",
          //   name: "WINNER",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/BLUELOCK_02.jpg?raw=true",
          //   source: "",
          //   url: "https://open.spotify.com/artist/58zz0VTpGNHn7MGTlW2cxQ?si=aWlwHobXTZqp3af9RTsmeQ",
          // },
          {     // Chainsawman
            artist: "Kenshi Yonezu",
            name: "KICK BACK",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/chainsaw%20man.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/KICK%20BACK.mp3?raw=true",
            url: "https://open.spotify.com/artist/1snhtMLeb2DYoMOcVbb8iB?si=9J1_FX5xQYygvaorO2MhMw",
          }, {
            artist: "Vaundy",
            name: "Chainsaw Blood",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/chainsaw%20man_02.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/CHAINSAW%20BLOOD.mp3?raw=true",
            url: "https://open.spotify.com/track/3lUOzabhWYyRImRszpJGOU?si=0a5867cf69274873",
          },
          // {     // 4-nin
          //   artist: "NACHERRY",
          //   name: "Eclipse",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/4-nin%20wa%20Sorezore%20Uso%20wo%20Tsuku.jpg?raw=true",
          //   source: "",
          //   url: "https://open.spotify.com/artist/2eTqjdLK1BCOgC7aYJgq6Y?si=8FvB4INLSTC3bivy8jw2_g",
          // }, {      // 4-nin
          //   artist: "",
          //   name: "",
          //   cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/4-nin%20wa%20Sorezore%20Uso%20wo%20Tsuku_02.jpg?raw=true",
          //   source: "",
          //   url: "",
          // },
          {       //Spy x family 2
            artist: "BUMP OF CHICKEN",
            name: "SOUVENIR",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/spy%20x%20family%202.jfif?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Souvenir.mp3?raw=true",
            url: "https://open.spotify.com/artist/0hSFeqPehe7FtCNWuQ6Bsy?si=QfTnda0mSG2VcKKQ54AAqw",
          }, {
            artist: "Yama",
            name: "Shikisai",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/spy%20x%20family%202_01.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Color.mp3?raw=true",
            url: "https://open.spotify.com/artist/7kOrrFIBIBc8uCu2zbxbLv?si=AjO_lz32QuOgEfI_ySOkvg",
          },
          {       // Boku no Hero 6
            artist: "SUPER BEAVER",
            name: "Hitamuki",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/boku%20no%20hero%206.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Hitamuki.mp3?raw=true",
            url: "https://open.spotify.com/artist/0SMhG4gXGD4gzLMMz08cQU?si=8_ArI4LxToucx-xMvs0XgA",
          }, {   
            artist: "Kiro Akiyama",
            name: "SKETCH",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/boku%20no%20hero%206_01.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Sketch.webm?raw=true",
            url: "https://open.spotify.com/artist/0SMhG4gXGD4gzLMMz08cQU?si=8_ArI4LxToucx-xMvs0XgA",
          },
          {       // Golden Kamuy 4
            artist: "ALI",
            name: "NEVER SAY GOODBYE",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/golden%20kamui%204.jfif?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/never_say_goodbye.mp3?raw=true",
            url: "https://open.spotify.com/artist/2Qqrew4ZcEwf9NY7UqWGfU?si=a7giZCBgQseDbmUWrT2HiQ",
          }, {
            artist: "THE SPELLBOUND",
            name: "Subete ga Soko ni Arimasu You ni",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/golden%20kamui%204_02.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/subete_ga_soko_ni_arimasu_y%C5%8D_ni.mp3?raw=true",
            url: "https://open.spotify.com/artist/1urc1bS4D4upX4Mb9kLnMb?si=gSkavx5BTYKuDkZvo2Ti3g",
          },
          {       // Mob Psycho 3
            artist: "Mob Choir",
            name: "1",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/Mob%20Psycho%203.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/1.mp3?raw=true",
            url: "https://open.spotify.com/artist/5HZsYhRCMH3zR0yndRcLVw?si=X6HtZ9jLSC2XGNFBjjmqxA",
          }, {
            artist: "Mob Choir",
            name: "Cobalt",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/Mob%20Psycho%203_01.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Cobalt.mp3?raw=true",
            url: "https://open.spotify.com/artist/5HZsYhRCMH3zR0yndRcLVw?si=X6HtZ9jLSC2XGNFBjjmqxA",
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
