const toTop = document.querySelector(".to-top");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 700) {
    toTop.classList.add("active");
  } else {
    toTop.classList.remove("active");
  }
})



// // ------------------------- Drag Function ---------------------------------------------------------------------------------------------------------------------------

// Make the DIV element draggable:
dragElement(document.getElementById("drag"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// ------------------- Topnav Function --------------------------------------------------------------------------------------------------------------------------------
function myFunction() {
	var x = document.getElementById("banner");
	if (x.className == "topnav") {
		x.className += " responsive";
	} else {
		x.className = "topnav";
	}
} 

function ShowHidden(el) {
	var display = document.getElementById(el).style.display;
	if(display == "none")
		document.getElementById(el).style.display = 'block';
	else
		document.getElementById(el).style.display = 'none';
}

$(document).ready(function(){

// ----------------------------- Mp3 Player ----------------------------------------------------
  var playlist = [{
      title:"Beyond Selves",
      artist:"Void_Chords",
      mp3:"https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Beyond%20selves.mp3?raw=true",
      poster: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/rwby.webp?raw=true"
    },{
      title:"Awake",
      artist:"Saori Hayami",
      mp3:"https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Awake.mp3?raw=true",
      poster: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/rwby.webp?raw=true"
    },{
      title:"Daten",
      artist:"Creepy Nuts",
      mp3:"https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Music/Daten.mp3?raw=true",
      poster: "https://github.com/aokami-aka/Site/blob/main/Temporadas/2022/Julho%202022/Estr%C3%A9ias/Yofukashi%20no%20Uta.webp?raw=true"
  }]
  
  var cssSelector = {
    jPlayer: "#jquery_jplayer",
    cssSelectorAncestor: ".music-player"
  };
  
  var options = {
    swfPath: "https://cdnjs.cloudflare.com/ajax/libs/jplayer/2.6.4/jquery.jplayer/Jplayer.swf",
    supplied: "ogv, m4v, oga, mp3",
    volumechange: function(event) {
      $( ".volume-level" ).slider("value", event.jPlayer.options.volume);
    },
    timeupdate: function(event) {
      $( ".progress" ).slider("value", event.jPlayer.status.currentPercentAbsolute);
    }
  };
  
  var myPlaylist = new jPlayerPlaylist(cssSelector, playlist, options);
  var PlayerData = $(cssSelector.jPlayer).data("jPlayer");
  
  
  // Create the volume slider control
  $( ".volume-level" ).slider({
     animate: "fast",
		max: 1,
		range: "min",
		step: 0.01,
		value : $.jPlayer.prototype.options.volume,
		slide: function(event, ui) {
			$(cssSelector.jPlayer).jPlayer("option", "muted", false);
			$(cssSelector.jPlayer).jPlayer("option", "volume", ui.value);
		}
  });
  
  // Create the progress slider control
  $( ".progress" ).slider({
		animate: "fast",
		max: 100,
		range: "min",
		step: 0.1,
		value : 0,
		slide: function(event, ui) {
			var sp = PlayerData.status.seekPercent;
			if(sp > 0) {
				// Move the play-head to the value and factor in the seek percent.
				$(cssSelector.jPlayer).jPlayer("playHead", ui.value * (100 / sp));
			} else {
				// Create a timeout to reset this slider to zero.
				setTimeout(function() {
					 $( ".progress" ).slider("value", 0);
				}, 0);
			}
		}
	});

  
});
