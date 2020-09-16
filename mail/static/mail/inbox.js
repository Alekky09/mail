document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.getElementById('inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.getElementById('sent').addEventListener('click', () => load_mailbox('sent'));
  document.getElementById('archived').addEventListener('click', () => load_mailbox('archive'));
  document.getElementById('compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.getElementById('emails-view').style.display = 'none';
  document.getElementById('single-view').style.display = 'none';
  document.getElementById('compose-view').style.display = 'block';

  // Clear out composition fields
  document.getElementById('compose-recipients').value = '';
  document.getElementById('compose-subject').value = '';
  document.getElementById('compose-body').value = '';

  document.getElementById('compose-form').onsubmit = function() {
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.getElementById('compose-recipients').value,
          subject: document.getElementById('compose-subject').value,
          body: document.getElementById('compose-body').value.trim()
      })
    })
    .then(response => 
      response.json())
    .then( () => {
      load_mailbox('sent');
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.getElementById('compose-view').style.display = 'none';
  document.getElementById('single-view').style.display = 'none';
  
  // Show the mailbox name
  document.getElementById('emails-header').innerText = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);

  // Get emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    let emailList;
    if(!document.getElementById('emails-list')){
      emailList = document.createElement("div");
      emailList.setAttribute("id", "emails-list");
    }
    else{
      emailList = document.getElementById('emails-list');
      emailList.innerHTML = '';
    }

    emails.forEach(email => {

      let emailObject = document.createElement("li");
      let recipients = document.createElement("span");
      let subject = document.createElement("span");
      let time = document.createElement("span");

      if(mailbox === 'sent') {
        recipients.innerText = email.recipients;
      }
      else{
        recipients.innerText = email.sender;
      }

      subject.innerText = email.subject;
      time.innerText = email.timestamp;

      emailObject.appendChild(recipients);
      emailObject.appendChild(subject);
      emailObject.appendChild(time);
      if(email.read){
        emailObject.className = "read"
      }
      else{
        emailObject.className = "unread"
      }
      emailObject.addEventListener('click', function() {
        load_email(email.id);
      })
      emailList.appendChild(emailObject);

    })

    document.getElementById('emails-view').appendChild(emailList);
    document.getElementById('emails-view').style.display = 'block';
  })
}

function load_email(email) {
  document.getElementById('emails-view').style.display = 'none';
  document.getElementById('compose-view').style.display = 'none';
  document.getElementById('single-header').innerHTML = '';
  document.getElementById('single-body').innerHTML = '';

  // Get the email
  fetch(`/emails/${email}`)
  .then(response => response.json())
  .then(email => {
    // if(email.error){show error view}
    let header = document.getElementById("single-header");
    let body = document.getElementById("single-body");
    header.innerHTML = 
      `<li><span>From:</span><span>${email.sender}</span></li>
      <li><span>To:</span><span>${email.recipients}</span></li>
      <li><span>Subject:</span><span>${email.subject}</span></li>
      <li><span>Timestamp:</span><span>${email.timestamp}</span></li>`;
    
    if(email.sender != JSON.parse(document.getElementById('user_email').textContent)){

      let emailButtons = document.createElement('div');
      let archiveButton = document.createElement('button');
      archiveButton.className = "btn btn-sm btn-outline-primary";

      if(!email.archived){
        archiveButton.innerText = "Archive";
        archiveButton.addEventListener("click", function(){
          archive(email.id, true);
        })
      }
      else{
        archiveButton.innerText = "Unarchive";
        archiveButton.addEventListener("click", function(){
          archive(email.id, false);
        })
      }
      emailButtons.appendChild(archiveButton);

      let replyButton = document.createElement('buttom');
      replyButton.className = "btn btn-sm btn-outline-primary";
      replyButton.innerText = "Reply";
      replyButton.addEventListener("click", function(){
        compose_email()
        document.getElementById('compose-recipients').value = email.sender;
        if(email.subject.includes("Re:")){
          document.getElementById('compose-subject').value = email.subject;
        }
        else{
          document.getElementById('compose-subject').value = `Re: ${email.subject}`;
        }
        document.getElementById('compose-body').value = `\n \n \nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
      })
      emailButtons.appendChild(replyButton);
      header.appendChild(emailButtons);
    }

    body.innerText = email.body;
  })
  
  fetch(`/emails/${email}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  document.getElementById('single-view').style.display = 'block';
  
}

function archive(email, archiveBool) {
  fetch(`/emails/${email}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archiveBool
    })
  })
  .then(() => {
    load_mailbox('inbox');
  })
}
