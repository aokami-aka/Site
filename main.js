const toTop = document.querySelector(".to-top");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 700) {
    toTop.classList.add("active");
  } else {
    toTop.classList.remove("active");
  }
})

// // ------------------- Topnav Function --------------------------------------------------------------------------------------------------------------------------------
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

class Accordion {
	constructor(el) {
	  // Store the <details> element
	  this.el = el;
	  // Store the <summary> element
	  this.summary = el.querySelector('summary');
	  // Store the <div class="content"> element
	  this.content = el.querySelector('.content');
  
	  // Store the animation object (so we can cancel it if needed)
	  this.animation = null;
	  // Store if the element is closing
	  this.isClosing = false;
	  // Store if the element is expanding
	  this.isExpanding = false;
	  // Detect user clicks on the summary element
	  this.summary.addEventListener('click', (e) => this.onClick(e));
	}
  
	onClick(e) {
	  // Stop default behaviour from the browser
	  e.preventDefault();
	  // Add an overflow on the <details> to avoid content overflowing
	  this.el.style.overflow = 'hidden';
	  // Check if the element is being closed or is already closed
	  if (this.isClosing || !this.el.open) {
		this.open();
	  // Check if the element is being openned or is already open
	  } else if (this.isExpanding || this.el.open) {
		this.shrink();
	  }
	}
  
	shrink() {
	  // Set the element as "being closed"
	  this.isClosing = true;
	  
	  // Store the current height of the element
	  const startHeight = `${this.el.offsetHeight}px`;
	  // Calculate the height of the summary
	  const endHeight = `${this.summary.offsetHeight}px`;
	  
	  // If there is already an animation running
	  if (this.animation) {
		// Cancel the current animation
		this.animation.cancel();
	  }
	  
	  // Start a WAAPI animation
	  this.animation = this.el.animate({
		// Set the keyframes from the startHeight to endHeight
		height: [startHeight, endHeight]
	  }, {
		duration: 200,
		easing: 'ease-out'
	  });
	  
	  // When the animation is complete, call onAnimationFinish()
	  this.animation.onfinish = () => this.onAnimationFinish(false);
	  // If the animation is cancelled, isClosing variable is set to false
	  this.animation.oncancel = () => this.isClosing = false;
	}
  
	open() {
	  // Apply a fixed height on the element
	  this.el.style.height = `${this.el.offsetHeight}px`;
	  // Force the [open] attribute on the details element
	  this.el.open = true;
	  // Wait for the next frame to call the expand function
	  window.requestAnimationFrame(() => this.expand());
	}
  
	expand() {
	  // Set the element as "being expanding"
	  this.isExpanding = true;
	  // Get the current fixed height of the element
	  const startHeight = `${this.el.offsetHeight}px`;
	  // Calculate the open height of the element (summary height + content height)
	  const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
	  
	  // If there is already an animation running
	  if (this.animation) {
		// Cancel the current animation
		this.animation.cancel();
	  }
	  
	  // Start a WAAPI animation
	  this.animation = this.el.animate({
		// Set the keyframes from the startHeight to endHeight
		height: [startHeight, endHeight]
	  }, {
		duration: 200,
		easing: 'ease-out'
	  });
	  // When the animation is complete, call onAnimationFinish()
	  this.animation.onfinish = () => this.onAnimationFinish(true);
	  // If the animation is cancelled, isExpanding variable is set to false
	  this.animation.oncancel = () => this.isExpanding = false;
	}
  
	onAnimationFinish(open) {
	  // Set the open attribute based on the parameter
	  this.el.open = open;
	  // Clear the stored animation
	  this.animation = null;
	  // Reset isClosing & isExpanding
	  this.isClosing = false;
	  this.isExpanding = false;
	  // Remove the overflow hidden and the fixed height
	  this.el.style.height = this.el.style.overflow = '';
	}
  }
  
  document.querySelectorAll('details').forEach((el) => {
	new Accordion(el);
});

// ---------------- Modal Image Function ---------------------------------------------

// create references to the modal...
var modal = document.getElementById('myModal');
// to all images -- note I'm using a class!
var images = document.getElementsByClassName('myImages');
// the image in the modal
var modalImg = document.getElementById("img01");
// and the caption in the modal
var captionText = document.getElementById("caption");

// Go through all of the images with our custom class
for (var i = 0; i < images.length; i++) {
  var img = images[i];
  // and attach our click listener for this image.
  img.onclick = function(evt) {
    modal.style.display = "block";
    modalImg.src = this.src;
	captionText.innerHTML = this.alt;
  }
}

modal.onclick = function() {
  modal.style.display = "none";
}

document.addEventListener("keydown", function (e) {
	if (e.key == "Escape") {
		modal.style.display = "none";
	}
});

// // ------------------ Slides Function -------------------------------------------------------------------------------------------------------------
let slideIndex = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
var slideId = ["mySlides1", "mySlides2","mySlides3","mySlides4","mySlides5","mySlides6", "mySlides7","mySlides8","mySlides9","mySlides10","mySlides11", "mySlides12","mySlides13","mySlides14","mySlides15","mySlides16", "mySlides17","mySlides18","mySlides19","mySlides20","mySlides21","mySlides22","mySlides23","mySlides24","mySlides25","mySlides26","mySlides27","mySlides28","mySlides29","mySlides30","mySlides31","mySlides32","mySlides33","mySlides34","mySlides35","mySlides36","mySlides37","mySlides38","mySlides39","mySlides40"] // .. multi slide class  name in array
//initalization 
showSlides(1, 0);  // zero  index
showSlides(1, 1);  // first  
showSlides(1, 2);  // second  
showSlides(1, 3);  // third 
showSlides(1, 4);   //four 
showSlides(1, 5);  
showSlides(1, 6);    
showSlides(1, 7);   
showSlides(1, 8);  
showSlides(1, 9); 
showSlides(1, 10);  
showSlides(1, 11);    
showSlides(1, 12);   
showSlides(1, 13);  
showSlides(1, 14);  
showSlides(1, 15);  
showSlides(1, 16);  
showSlides(1, 17);    
showSlides(1, 18);   
showSlides(1, 19);  
showSlides(1, 20);  
showSlides(1, 21); 
showSlides(1, 22); 
showSlides(1, 23); 
showSlides(1, 24); 
showSlides(1, 25); 
showSlides(1, 26); 
showSlides(1, 27); 
showSlides(1, 28); 
showSlides(1, 29); 
showSlides(1, 30); 
showSlides(1, 31); 
showSlides(1, 32); 
showSlides(1, 33); 
showSlides(1, 34); 
showSlides(1, 35); 
showSlides(1, 36); 
showSlides(1, 37); 
showSlides(1, 38); 
showSlides(1, 39); 
showSlides(1, 40); 
//....

function plusSlides(n, no) {
  showSlides(slideIndex[no] += n, no);
}

function showSlides(n, no) {
  let i;
  let x = document.getElementsByClassName(slideId[no]);
  if (n > x.length) {slideIndex[no] = 1}

  if (n < 1) {slideIndex[no] = x.length}
  for (i = 0; i < x.length; i++) {
     x[i].style.display = "none";  
  }
  x[slideIndex[no]-1].style.display = "block";  
}

// -------- New design ---------------------------

function AnimeCard(title, titleEnglish, slideid, Thumb1, Thumb2, Thumb3, Thumb4, slidegroup, Synopsis, Genre, DirectorLink, Director, Director2Link, Director2,  DirectorWorks, StudioLink, Studio, Studio2Link, Studio2, StudioWorks, Time, Duration, Commentary, Anidb, Mal, Cr, netflix, disney, Video1, Poster1, caption1, Video2, Poster2, caption2, Video3, Poster3, caption3) {
            var animecard = document.querySelector('.animeCard');
            var animeTitle = document.getElementById('anime-title');
            var animetitleEnglish = document.getElementById('anime-title-english');
            var animeThumb1 = document.getElementById('anime-cardThumb1');
            var animeThumb2 = document.getElementById('anime-cardThumb2');
            var animeThumb3 = document.getElementById('anime-cardThumb3');
            var animeThumb4 = document.getElementById('anime-cardThumb4');
			var prevslidebutton = document.querySelector('.prev');
			var prevcurrentslideid = prevslidebutton.getAttribute('onclick');
			var prevsetslideid = prevcurrentslideid.replace(/plusSlides\(-1, \d+\)/, "plusSlides(-1, " + slidegroup + ")");
			var nextslidebutton = document.querySelector('.next');
			var nextcurrentslideid = nextslidebutton.getAttribute('onclick');
			var nextsetslideid = nextcurrentslideid.replace(/plusSlides\(1, \d+\)/, "plusSlides(1, " + slidegroup + ")");
            let text = 1;
            var text1 = document.getElementById('text1');
            var text2 = document.getElementById('text2');
            var text3 = document.getElementById('text3');
            var text4 = document.getElementById('text4');
            var animeSynopsis = document.getElementById('anime-synopsis');
            var animeGenre = document.getElementById('anime-genre');
            var animeDirectorLink = document.getElementById('anime-director-link');
			var animeDirector2Link = document.getElementById('anime-director2-link');
            var animeDirector = document.getElementById('anime-director');
			var animeDirector2 = document.getElementById('anime-director2');
            var animeDirectorWorks = document.getElementById('anime-director-works');
            var animeStudioLink = document.getElementById('anime-studio-link');
			var animeStudio2Link = document.getElementById('anime-studio2-link');
            var animeStudio = document.getElementById('anime-studio');
			var animeStudio2 = document.getElementById('anime-studio2');
            var animeStudioWorks = document.getElementById('anime-studio-works');
            var animeTime = document.getElementById('anime-time');
            var animeDuration = document.getElementById('anime-duration');
            var animeCommentary = document.getElementById('anime-commentary');
            var animeAnidb = document.getElementById('anime-anidb');
            var animeMal = document.getElementById('anime-mal');
            var animeCr = document.getElementById('anime-cr');
			var animeNetflix = document.getElementById('anime-netflix');
			var animeDisney = document.getElementById('anime-disney');
			var animeVideo1container = document.getElementById('anime-video1-container');
            var animeVideo1 = document.getElementById('anime-video1');
            var animeCaption1 = document.getElementById('anime-video1-caption');
            var animeVideo2container = document.getElementById('anime-video2-container');
            var animeVideo2 = document.getElementById('anime-video2');
            var animeCaption2 = document.getElementById('anime-video2-caption');
            var animeVideo3container = document.getElementById('anime-video3-container');
            var animeVideo3 = document.getElementById('anime-video3');
            var animeCaption3 = document.getElementById('anime-video3-caption');

            if (animecard.style.display === 'none' || animeTitle.innerHTML !== title) {
                animecard.style.display = 'block';
                animeTitle.innerHTML = title;
                animetitleEnglish.innerHTML = titleEnglish;
				document.getElementById('thumb1-container').className = slideid+' fade';
				document.getElementById('thumb2-container').className = slideid+' fade';
				document.getElementById('thumb3-container').className = slideid+' fade';
				document.getElementById('thumb4-container').className = slideid+' fade';
                animeThumb1.src = Thumb1;
                animeThumb2.src = Thumb2;
                animeThumb3.src = Thumb3;
                animeThumb4.src = Thumb4;
				prevslidebutton.setAttribute("onclick", prevsetslideid);
				nextslidebutton.setAttribute("onclick", nextsetslideid);
                text1.innerHTML = '1 / ' + text
                text2.innerHTML = '2 / ' + text
                text3.innerHTML = '3 / ' + text
                text4.innerHTML = '4 / ' + text
                animeSynopsis.innerHTML = Synopsis;
                animeSynopsis.innerHTML = Synopsis.replace(/\n/g, '<br>');
                animeGenre.innerHTML = Genre;
                animeDirectorLink.href = DirectorLink;
				animeDirector2Link.href = Director2Link;
                animeDirector.innerHTML = Director;
				animeDirector2.innerHTML = Director2;
                animeDirectorWorks.innerHTML = DirectorWorks;
                animeStudioLink.href = StudioLink;
				animeStudio2Link.href = Studio2Link;
                animeStudio.src = Studio;
				animeStudio2.src = Studio2;
                animeStudioWorks.innerHTML = StudioWorks;
                animeTime.innerHTML = Time;
                animeDuration.innerHTML = Duration;
                animeCommentary.innerHTML = Commentary;
                animeAnidb.href = Anidb;
                animeMal.href = Mal;
                animeCr.href = Cr;
				animeNetflix.href = netflix;
				animeDisney.href = disney;
                animeVideo1.src = Video1;
                animeVideo1.poster = Poster1;
                animeCaption1.innerHTML = caption1;
                animeVideo2.src = Video2;
                animeVideo2.poster = Poster2;
                animeCaption2.innerHTML = caption2;
                animeVideo3.src = Video3;
                animeVideo3.poster = Poster3;
                animeCaption3.innerHTML = caption3;
            } else {
                animecard.style.display = 'none';
            }

			if (Video1 == "false") {
                animeVideo1container.style.display = 'none';
            } else {
                animeVideo1container.style.display = 'list-item';
            }
            if (Video2 == "false") {
                animeVideo2container.style.display = 'none';
            } else {
                animeVideo2container.style.display = 'list-item';
            }
            if (Video3 == "false") {
                animeVideo3container.style.display = 'none';
            } else {
                animeVideo3container.style.display = 'list-item';
            }

            if (Cr == "nolink") {
                document.getElementById('cr-image').style.opacity = '60%';
                document.getElementById('cr-image').style.cursor = 'default';
				animeCr.href = '#anime-card'; animeCr.target = ""
            } else {
                document.getElementById('cr-image').style.opacity = '100%';
                document.getElementById('cr-image').style.cursor = 'pointer';
				animeCr.target = "_blank"
            }
			if (netflix == "nolink") {
                document.getElementById('netflix-image').style.opacity = '60%';
                document.getElementById('netflix-image').style.cursor = 'default';
				animeNetflix.href = '#anime-card'; animeNetflix.target = ""
            } else {
                document.getElementById('netflix-image').style.opacity = '100%';
                document.getElementById('netflix-image').style.cursor = 'pointer';
				animeNetflix.target = "_blank"
            }
			if (disney == "nolink") {
                document.getElementById('disney-image').style.opacity = '60%';
                document.getElementById('disney-image').style.cursor = 'default';
				animeDisney.href = '#anime-card'; animeDisney.target = ""
            } else {
                document.getElementById('disney-image').style.opacity = '100%';
                document.getElementById('disney-image').style.cursor = 'pointer';
				animeDisney.target = "_blank"
            }
            if (Cr == "false") {
                document.getElementById('cr-image').style.display = 'none';
            } else {
                document.getElementById('cr-image').style.display = 'inherit';
            }
			if (netflix == "false") {
                document.getElementById('netflix-image').style.display = 'none';
            } else {
                document.getElementById('netflix-image').style.display = 'inherit';
            }
			if (disney == "false") {
                document.getElementById('disney-image').style.display = 'none';
            } else {
                document.getElementById('disney-image').style.display = 'inherit';
            }

            if (Thumb2 == "false") {
				animeThumb2.src = Thumb1, animeThumb3.src = Thumb1, animeThumb4.src = Thumb1;
                document.getElementById('thumb1-container').className = slideid, document.getElementById('thumb2-container').className = slideid, document.getElementById('thumb3-container').className = slideid, document.getElementById('thumb4-container').className = slideid;
				text1.innerHTML = '1 / ' + text, text2.innerHTML = '1 / ' + text, text3.innerHTML = '1 / ' + text, text4.innerHTML = '1 / ' + text;
            } else if (Thumb3 == "false") {
				animeThumb3.src = Thumb2, animeThumb4.src = Thumb2;
                document.getElementById('thumb3-container').className = slideid, document.getElementById('thumb4-container').className = slideid;
				text = 2;
				text1.innerHTML = '1 / ' + text, text2.innerHTML = '2 / ' + text, text3.innerHTML = '2 / ' + text, text4.innerHTML = '2 / ' + text;
            } else if (Thumb4 == "false") {
				animeThumb4.src = Thumb3;
                document.getElementById('thumb4-container').className = slideid;
				text = 3;
				text1.innerHTML = '1 / ' + text, text2.innerHTML = '2 / ' + text, text3.innerHTML = '3 / ' + text, text4.innerHTML = '3 / ' + text;
            } else {
                text = 4;
                text1.innerHTML = '1 / ' + text, text2.innerHTML = '2 / ' + text, text3.innerHTML = '3 / ' + text, text4.innerHTML = '4 / ' + text;
            } 

			if (StudioLink == '') {
				document.getElementById('anime-studio-link').style.display = 'none';
			} else {
				document.getElementById('anime-studio-link').style.display = '';
			}
			if (Studio2Link == '') {
				document.getElementById('anime-studio2-link').style.display = 'none';
			} else {
				document.getElementById('anime-studio2-link').style.display = '';
			}
        }
