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
          {             // Lycoris Recoil
            artist: "Sayuri",
            name: "Hana no Tou",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/Lycoris%20Recoil_01.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Hana%20no%20Tou.mp3?raw=true",
            url: "https://open.spotify.com/track/1yt4wO7dKCwsfjch8SN9aU?si=0a764c19f75d48a5",
          },

          {         // Lycoris Recoil
            artist: "Halca",
            name: "Darekare Scramble",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/Engage%20Kiss.png?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/darekare%20scramble.mp3?raw=true",
            url: "https://open.spotify.com/artist/2xOEM6pRUsLhlx2PzaQuK2?si=dUnp_oXwSO-Bv5UGGYlCJQ",
          },

          {         //  RWBY         
            name: "Beyond Selves",
            artist: "Voice_chords",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/rwby.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Beyond%20selves.mp3?raw=true",
            url: "https://open.spotify.com/track/0yhDRfvMNnEzSTyGvfu5ds?si=b0f86d9ccbf34048",
          },
          {
            name: "Awake",
            artist: "Saori Hayami",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/rwby.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Awake.mp3?raw=true",
            url: "https://open.spotify.com/artist/32UDgij5Tm7EtyRRCC1JTN?si=9B1_DqDwTJeo8R5QfyHmWg",
          },

          {     //  Yurei Deco
            name: "1,000,000 Love",
            artist: "Clammbon",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/Yurei%20Deco.jpg?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/1,000,000,000,000,000,000,000,000%20Love.mp3?raw=true",
            url: "https://open.spotify.com/track/7r7AFeFqZHVxa85ffesTAY?si=c2279ad29a504e0b",
          },

          {
            name: "story",
            artist: "Mayu Maeshima",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/Isekai%20Ojisan.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Story.mp3?raw=true",
            url: "https://open.spotify.com/artist/0M0v61x8lN3rDLbmTnlYBg?si=y0aaTG-bQoGGUxDmfjD93w",
          },
          {
            name: "Ichibanboshi Sonority",
            artist: "Yuka Iguchi",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/Isekai%20Ojisan_01.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Ichibanboshi%20Sonority.mp3?raw=true",
            url: "https://open.spotify.com/artist/2pEoqcvCSXliNrd8peAUiP?si=T6L6DYbPR4y6aOWc8E-VQg",
          },

          {   // Kanojo Okarishimasu 2
            name: "Himitsu Koigokoro",
            artist: "Chico With Honeyworks",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Continua%C3%A7%C3%B5es/Kanojo,%20Okarishimasu%202.png?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Himitsu%20Koigokoro.mp3?raw=true",
            url: "https://open.spotify.com/track/532a4qwtCf56E6qjiAn2EE?si=32a6b655bf5c42f1",
          },

          {   // Overlord IV
            name: "No Man´s Dawn",
            artist: "Mayu Maeshima",
            cover: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Continua%C3%A7%C3%B5es/Overlord%20IV_01.webp?raw=true",
            source: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/No%20Man%C2%B4s%20Dawn.mp3?raw=true",
            url: "https://open.spotify.com/artist/0M0v61x8lN3rDLbmTnlYBg?si=y0aaTG-bQoGGUxDmfjD93w",
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
        let position = (x - 50) - progress.offsetLeft;
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
