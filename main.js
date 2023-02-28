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
