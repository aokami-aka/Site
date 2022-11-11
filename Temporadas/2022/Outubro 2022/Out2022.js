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
          {     // Kokyu no Karazu
            artist: "Ziyoou-vachi",
            name: "MYSTERIOUS",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/Kokyu%20no%20Karasu.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/mysterious.mp3?raw=true",
            url: "https://open.spotify.com/artist/35jRIUtWCUITFLfjhYwkFx?si=0dg4QciYQD2mjQn5jeMZEg",
          }, {   
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
          {     // Blue Lock
            artist: "UNISON SQUARE GARDEN",
            name: "Chaos wo Kiwamaru",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/BLUELOCK.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Chaos%20Ga%20Kiwamaru.mp3?raw=true",
            url: "https://open.spotify.com/artist/449AEgfeOxqAuRn0uX6l3u?si=SkJZnzc8TpGW35z6OYWCXw",
          }, {     
            artist: "Shingo Nakamura",
            name: "WINNER",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/BLUELOCK_02.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/winner.mp3?raw=true",
            url: "https://open.spotify.com/artist/58zz0VTpGNHn7MGTlW2cxQ?si=aWlwHobXTZqp3af9RTsmeQ",
          },
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
          }, {
            artist: "Zanki",
            name: "ZuttoMayo",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/chainsawman_03.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Chu%2C%20Tayousei.mp3?raw=true",
            url: "https://open.spotify.com/track/1XeOqgzh2fZhmgxnmyiIJ8?si=7290d77fd2f9470b",
          }, {
            artist: "Maximum the Hormone",
            name: "Hawatari 2 Oku Centi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/chainsawman_04.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Hawatari%202%20Oku%20Centi.mp3?raw=true",
            url: "https://open.spotify.com/track/1lySGuhlcZUJxLA5W5Bo7k?si=1893c9d679414de9",
          }, {
            artist: "Tooboe",
            name: "Jouzai",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/chainsawman_05.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Jouzai.mp3?raw=true",
            url: "https://open.spotify.com/track/04niDJQ3mzjkwzvid0Otoi?si=7a3758aaa30a4ee9",
          }, {
            artist: "Syudou",
            name: "In the Backroom",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/chainsawman_06.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/In%20the%20Backroom.mp3?raw=true",
            url: "https://open.spotify.com/artist/43XkWaoCS0wKjuMJrWFgoa?si=4J4j9dMfTDSRAVI27P-zNA",
          },
          {      // Urusei Yatsura
            artist: "Minami, SAKURAmoti",
            name: "Aiue",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/URUSEI%20YATSURA.jpeg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Aiue.mp3?raw=true",
            url: "https://open.spotify.com/track/3lUOzabhWYyRImRszpJGOU?si=0a5867cf69274873",
          }, {
            artist: "Maisondes",
            name: "Tokyo Shandy Rendezvous",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/URUSEI%20YATSURA_01.jfif?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Tokyo%20Shandy%20Rendezvous.mp3?raw=true",
            url: "https://open.spotify.com/artist/7LTiBdByoaUd329wCpmMcM?si=7-mzmDDVQuGh08PLmXiHmg",
          },
          {     // 4-nin
            artist: "NACHERRY",
            name: "Eclipse",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/4-nin%20wa%20Sorezore%20Uso%20wo%20Tsuku.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/eclipse.mp3?raw=true",
            url: "https://open.spotify.com/artist/2eTqjdLK1BCOgC7aYJgq6Y?si=8FvB4INLSTC3bivy8jw2_g",
          }, 
          {      // Arknights
            artist: "ReoNa",
            name: "Alive",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Estr%C3%A9ias/arknights.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/alive.mp3?raw=true",
            url: "https://open.spotify.com/track/4HkMETY0zKUblZVAX22YUD?si=VFotaRAcRiyffHKOxYnPVg&utm_source=copy-link",
          },
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
          },
          {       // Iruma-kun 3
            artist: "Fantastics from Exile Tribe",
            name: "Girigiri Ride It Out",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/Mairimashita!%20Iruma-kun%203.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Girigiri%20Ride%20It%20Out.mp3?raw=true",
            url: "https://open.spotify.com/artist/162Ols90jU4CctXQz15NxS?si=q1pqo6TPQFCrl0jJzp_mUw",
          }, {
            artist: "Kameda Seiji",
            name: "Nabebugyou",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/Mairimashita!%20Iruma-kun%203_01.jfif?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Hot%20Pot%20Commander.mp3?raw=true",
            url: "https://open.spotify.com/artist/4gxF6fznAjW2jjDzjZrOka?si=zvcqgfF0Qx6HYevJFcYrkw",
          },
          {       // bleach
            artist: "Kitani Tatsuya",
            name: "Scar",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/Bleach.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Scar.mp3.webm?raw=true",
            url: "https://open.spotify.com/artist/7mvhRvEAHiCTQHUnH7fgnv?si=FFAn-U4pT8OiCuwca-lgJg",
          }, {
            artist: "SennaRin",
            name: "Saihate",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/Bleach_01.png?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Saihate.mp3?raw=true",
            url: "https://open.spotify.com/artist/05Thl0cxDfoKilfQ5Hwo7D?si=PmgUGkC8SMSxQzW8T5X6tQ",
          },
          {
            artist: "Hikaru Utada",
            name: "Pink Blood",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Continua%C3%A7%C3%B5es/fumetsu%20no%20anata%20e%202.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Outubro%202022/Music/Pink%20Blood.mp3?raw=true",
            url: "https://open.spotify.com/artist/7lbSsjYACZHn1MSDXPxNF2?si=wlyo9RVvSjmztj7h4-rK8A",
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
