// const currentDomain = window.location.hostname;

// // List of domains to check
// const allowedDomains = [
//     '360logz.com',
//     '360logz.shop',
//     '5bQ3fuyMRdPa.store',
//     'my360logz.com'
// ];

// // Check if the current domain is in the list

// setTimeout(() => {
//     if (allowedDomains.includes(currentDomain)) {
    
//         const scrollPosition = window.scrollY || window.pageYOffset;
//         localStorage.setItem('scrollPosition', scrollPosition.toString());
    
//         // Replace the domain with "247dailylogs.com"
//         const newUrl = window.location.href.replace(currentDomain, '247dailylogs.com');
    
//         // Redirect to the new URL
//         window.location.href = newUrl;
//         const savedScrollPosition = localStorage.getItem('scrollPosition');
//         window.scrollTo(0, parseInt(savedScrollPosition, 10));
//     }
    
// }, 10000);

// if (!allowedDomains.includes(currentDomain)) {
//     const savedScrollPosition = localStorage.getItem('scrollPosition');
//     if (savedScrollPosition !== null) {
//         window.scrollTo(0, parseInt(savedScrollPosition, 10));
//         localStorage.clear();
//     }
// }



// document.addEventListener('DOMContentLoaded', function() {
//     // Get all anchor tags on the webpage
//     const links = document.querySelectorAll('a');
//     // Add click event listener to each anchor tag
//     links.forEach(function(link) {
//         link.addEventListener('click', function(event) {
//             const mainDomain = window.location.hostname;
//             if(mainDomain != "247dailylogs.com") {
//                 event.preventDefault();
    
//                 // Get the current href attribute
//                 let href = new URL(this.getAttribute('href'));
//                 let currentDomain = href.hostname;
    
//                 // List of domains to check
//                 const allowedDomains = ['360logz.com','360logz.shop','5bQ3fuyMRdPa.store','my360logz.com'];
    
//                 if (allowedDomains.includes(currentDomain)) {
//                     const newUrl = this.getAttribute('href').replace(currentDomain, '247dailylogs.com');
//                     window.location.href = newUrl;
//                 }
//             }

//         });
//     });
// });

function renderDelayedHTML() {
    setTimeout(function() {
        // Create HTML elements
        var socialDiv = document.getElementById('socialIcons');
        socialDiv.innerHTML = `
            <div class="sicon-list">
                <a href="/social-link/telegram" class="icon-item" target="_blank">
                    <img src="https://i2Q7dCYnYmUY.co/BZbp119/image.png" alt="360logz-telegram-social-link">
                </a>
                <a href="/social-link/whatsappchannel" class="icon-item" target="_blank">
                    <img src="https://i2Q7dCYnYmUY.co/Y7CW5xr7/whatsappchannel.png" alt="360logz-wchannel-social-link">
                </a>
                <a href="/social-link/instagram" class="icon-item" target="_blank">
                    <img src="https://i2Q7dCYnYmUY.co/kqTcgyK/image.png" alt="360logz-instagram-social-link">
                </a>
                <a href="/social-link/whatsapp" class="icon-item" target="_blank">
                    <img src="https://i2Q7dCYnYmUY.co/jWR5nTY/image.png" alt="360logz-whatsapp-social-link">
                </a>
                <a href="/social-link/twitter" class="icon-item" target="_blank">
                    <img src="https://i2Q7dCYnYmUY.co/LXtpBfz6/xlogo.png" alt="360logz-twitter-social-link">
                </a>
            </div>
        `;
        
        // Append HTML elements to container
        container.appendChild(socialDiv);
    }, 15000); // 15 seconds delay
}

// Call the function to render delayed HTML after page load
window.onload = renderDelayedHTML;