function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');

  // When collapsing, close all submenus and enable all menu items
  if (sidebar.classList.contains('collapsed')) {
    document.querySelectorAll('.submenu.open').forEach(s => s.classList.remove('open'));
    document.querySelectorAll('.menu > .menu-item').forEach(item => {
      item.classList.remove('disabled');
    });
    // Reset main content when collapsing

  }
}

function toggleSubMenu(element) {
  const submenu = element.nextElementSibling;
  if (!submenu || !submenu.classList.contains('submenu')) return;

  // Close all open submenus
  document.querySelectorAll('.submenu.open').forEach(s => s.classList.remove('open'));

  // Disable all other main menu items
  document.querySelectorAll('.menu > .menu-item').forEach(item => {
    if (item !== element) {
      item.classList.add('disabled');
    }
  });

  submenu.classList.add('open');
}

function closeSubMenu(button) {
  const submenu = button.closest('.submenu');
  submenu.classList.remove('open');

  // Enable all main menu items
  document.querySelectorAll('.menu > .menu-item').forEach(item => {
    item.classList.remove('disabled');
  });

  // Reset main content when closing submenu
  loadOverview();
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
}

/* Load Overview */
function loadOverview() {
  const content = document.getElementById('main-content');
  content.innerHTML = `
<h2 style="margin-top: 0px;margin-bottom: 0px;">Welcome to the ABRWIZ Web App <strong>  => Learn => Explore => Implement </strong></h2>
	  <br></br>
	  <br></br>
	  <h2 style="margin-top: 0px;margin-bottom: 0px;">Many other things are coming as well <strong>=> =>!! </strong><br></br><br></br>Meanwhile, explore map services <strong>=> =>!! </strong></h2>
<!--
   <div class="ads-container">
      <div class="ad-box">Google Ad</div>
      <div class="ad-box">Amazon Ad</div>
      <div class="ad-box">Flipkart Ad</div>
      <div class="ad-box">Meesho Ad</div>
    </div> 
	-->
  `;
}
