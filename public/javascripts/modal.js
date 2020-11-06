let modalButton = document.getElementById('modalButton');
let newMessage = document.getElementById('newMessage');

//Open modal form
const openMessage = () => {
  let modal = document.getElementById('modal');
  modal.classList.add('is-active');
};

//Close modal form without submitting
const closeMessage = () => {
  let modal = document.getElementById('modal');
  modal.classList.remove('is-active');
};
