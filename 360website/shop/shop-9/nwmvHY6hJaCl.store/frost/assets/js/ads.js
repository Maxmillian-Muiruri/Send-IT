const arrayEl = [
    "https://Qu5fywcTabI9.co/LJsByzx/gpay-wallet.gif",
    "https://Qu5fywcTabI9.co/r5vfBHr/new-cahsapp.gif",
    "https://Qu5fywcTabI9.co/TLJXM24/clone-cashout.gif",
    "https://Qu5fywcTabI9.co/f8gNQDG/applepay-gif.gif"
];
const randomGif = arrayEl[Math.floor(Math.random() * arrayEl.length)];
var singleElements = document.querySelectorAll('#cl-body .cl-single');

// Randomly choose an element to clone
var randomIndex = Math.floor(Math.random() * singleElements.length);
var elementToClone = singleElements[randomIndex];

// Clone the chosen element
var clonedElement = elementToClone.cloneNode(true);

// Modify the h1 title and p title of the cloned element
clonedElement.querySelector('.product-info small').textContent = 'ADVERTISEMENT';
clonedElement.querySelector('.product-info .text-small a').classList.remove('text-muted')
clonedElement.querySelector('.product-info .text-small a').classList.add('text-white')
clonedElement.querySelector('.text-body a').textContent = 'LATEST CASHOUT VIDEOS';
clonedElement.querySelector('.text-body a').style.color = "#FFF"
clonedElement.querySelector('.product-img-box img').src = randomGif;
clonedElement.querySelector('.product-img-box .badge').textContent = 'ADVERT';
clonedElement.querySelector('.product-img-box a').href = '/cashout-clips';
clonedElement.querySelector('.product-info .text-body a').href = '/cashout-clips';
clonedElement.querySelector('.product-info').style.backgroundColor = '#000';
countIntro = clonedElement.querySelectorAll('.product-info .align-items-center div')[0].childElementCount
if(countIntro > 1) {
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[0].classList.add('d-none')
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[1].textContent = "WATCH NOW"
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[1].classList.add('text-white')
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[1].classList.remove('text-dark')
} else {
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[0].textContent = "WATCH NOW"
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[0].classList.add('text-white')
    clonedElement.querySelectorAll('.product-info .align-items-center div span')[0].classList.remove('text-dark')
}

// Get the parent element (cl-body)
var parentElement = document.querySelector('#cl-body');

// Choose a random position (excluding first and last)
var randomPosition = Math.floor(Math.random() * (parentElement.children.length - 2)) + 1;

// Insert the cloned element at the chosen position
parentElement.insertBefore(clonedElement, parentElement.children[randomPosition]);