const toTop = document.querySelector(".to-top");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 700) {
    toTop.classList.add("active");
  } else {
    toTop.classList.remove("active");
  }
})



// // // ------------------------- Drag Function ---------------------------------------------------------------------------------------------------------------------------

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

// // ------------------ Slides Function -------------------------------------------------------------------------------------------------------------
let slideIndex = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
var slideId = ["mySlides1", "mySlides2","mySlides3","mySlides4","mySlides5","mySlides6", "mySlides7","mySlides8","mySlides9","mySlides10","mySlides11", "mySlides12","mySlides13","mySlides14","mySlides15","mySlides16", "mySlides17","mySlides18","mySlides19","mySlides20","mySlides21","mySlides22","mySlides23","mySlides24","mySlides25","mySlides26","mySlides27","mySlides28","mySlides29","mySlides30"] // .. multi slide class  name in array
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

