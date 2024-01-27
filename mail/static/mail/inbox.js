document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(rec, sub, bd, reply) {
  // Create RegEx string
  const re = /Re: /;

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#full-mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  if (reply == undefined) {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    document.querySelector('#compose-recipients').value = rec;

    // Check for RegEx match
    if (sub.match(re) == null) {
      document.querySelector('#compose-subject').value = `Re: ${sub}`;
    } else {
      document.querySelector('#compose-subject').value = sub;
    }

    document.querySelector('#compose-body').value = bd;
  }

  // Make API call to send a new mail
  document.querySelector('#send-mail').onclick = () => {

    // Get values of composition fields
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    
    // Send a POST request
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent')
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#full-mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show all the emails in appropriate mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json ())
  .then(emails => {
    emails.forEach((element) => {
      // Create wrapper div and listen for clicks
      const div = document.createElement('div');
      div.className = 'email';
      div.addEventListener('click', () => load_email(element.id));

      // Change div color based on 'read' key
      if (element.read === true) {
        div.style.backgroundColor = '#d3d3d3';
      }

      // Create 'sender' heading
      const sender = document.createElement('h2');
      sender.innerHTML = `From: ${element.sender}`;
      sender.className = 'sender';
      div.append(sender);

      // Create 'subject' heading
      const subject = document.createElement('h3');
      subject.innerHTML = element.subject;
      subject.className = 'subject';
      div.append(subject);

      // Create 'timestamp' paragraph
      const timestamp = document.createElement('p');
      timestamp.innerHTML = `Received: ${element.timestamp}`;
      timestamp.className = 'timestamp';
      div.append(timestamp);

      // Add an 'archive' button to 'inbox' mails
      if (mailbox === 'inbox') {
        const button = document.createElement('button');
        button.innerHTML = 'Archive';
        button.addEventListener('click', (event) => {
          fetch(`/emails/${element.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
          .then(() => {
            event.stopPropagation;
            load_mailbox('inbox');
          }); 
        })
        div.append(button);
      }
      // Add an 'unarchive' button where 'element.archived is "true"'
      if (element.archived === true) {
      const button = document.createElement('button');
      button.innerHTML = 'Unarchive';
      console.log('adding click event');
      button.addEventListener('click', (event) => {
        fetch(`/emails/${element.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: false
          })
        })
        .then(() => {
          event.stopPropagation;
          load_mailbox('inbox')
        });
      });
      div.append(button);
    }
      // Append headings to div
      document.querySelector('#emails-view').append(div);
    });
  });
}

// Show mail (selected by id)
function load_email(id) {
  const mail_div = document.querySelector('#full-mail-view');
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  mail_div.style.display = 'block';

  // Clear old e-mail renders
  mail_div.innerHTML = '';

  // Update mail to 'read'
  fetch(`emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  // Render opened mail
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    console.log(email);
    // Select main div to display e-mail content
    const div = document.querySelector('#full-mail-view')

    // Create sender heading
    const sender = document.createElement('h4');
    sender.innerHTML = `From: ${email.sender}`;
    div.append(sender);

    // Create recipients heading
    const recipients = document.createElement('h5');
    recipients.innerHTML = `To: ${email.recipients}`;
    div.append(recipients);

    // Create subject heading
    const subject = document.createElement('h4');
    subject.innerHTML = `Subject: ${email.subject}`;
    div.append(subject);

    // Create timestamp
    const timestamp = document.createElement('p');
    timestamp.innerHTML = `Received: ${email.timestamp}`;
    div.append(timestamp);

    // Create reply button
    const reply = document.createElement('button');
    reply.innerHTML = 'Reply';
    reply.addEventListener('click', () => {
      const reply = true;
      const rec = email.sender;
      const sub = email.subject;
      const bd = `On ${email.timestamp} ${email.recipients} wrote: ${email.body}`
      compose_email(rec, sub, bd, reply);
    });
    div.append(reply);

    // Create e-mail body
    const body = document.createElement('p');
    body.innerHTML = email.body;
    div.append(body);
  });
}