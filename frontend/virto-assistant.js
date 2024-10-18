/* eslint-disable no-undef */
(function () {
  let isExpanded = false;

  function toggleChat(container, toggle) {
    container.classList.toggle('visible');
    toggle.innerHTML = container.classList.contains('visible') ? '✖' : '💬';
  }

  function resizeContainer(container, expanded) {
    isExpanded = expanded;
    if (isExpanded) {
      container.classList.add('expanded');
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.maxWidth = '100vw';
      container.style.maxHeight = '100vh';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.borderRadius = '0';
    } else {
      container.classList.remove('expanded');
      container.style.width = '400px';
      container.style.height = '600px';
      container.style.maxWidth = '500px';
      container.style.maxHeight = '700px';
      container.style.bottom = '90px';
      container.style.right = '20px';
      container.style.borderRadius = '8px';
    }
    container.style.transition = 'all 0.3s ease-in-out';
  }

  function initVirtoAssistant() {
    if (typeof window !== 'undefined' && window.document) {
      const container = document.createElement('div');
      container.id = 'virto-assistant-container';
      container.innerHTML = `
        <iframe id="virto-assistant-iframe" src="http://192.168.1.54:5173" allowfullscreen></iframe>
      `;

      const toggle = document.createElement('div');
      toggle.id = 'virto-assistant-toggle';
      toggle.innerHTML = '💬';

      document.body.appendChild(container);
      document.body.appendChild(toggle);

      const style = document.createElement('style');
      style.textContent = `
        #virto-assistant-container {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 400px;
          height: 600px;
          max-width: 500px;
          max-height: 700px;
          display: flex;
          flex-direction: column;
          background-color: #2A2A2A;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease-in-out;
          z-index: 50;
          font-family: sans-serif;
          opacity: 1;
          pointer-events: auto;
          display: none;
        }
        #virto-assistant-container.visible {
          display: flex;
        }
        #virto-assistant-container.expanded {
          width: 100vw;
          height: 100vh;
          max-width: 100vw;
          max-height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
        #virto-assistant-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        #virto-assistant-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #4285f4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 51;
          transition: all 0.3s ease-in-out;
        }
        @media (max-width: 640px) {
          #virto-assistant-container {
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
          }
          #virto-assistant-container.visible + #virto-assistant-toggle {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);

      toggle.addEventListener('click', () => {
        toggleChat(container, toggle);
      });

      window.addEventListener('message', (event) => {
        if (event.data.type === 'toggleChat') {
          toggleChat(container, toggle);
        } else if (event.data.type === 'toggleExpand') {
          resizeContainer(container, event.data.isExpanded);
          const iframe = document.getElementById('virto-assistant-iframe');
          iframe.contentWindow.postMessage(
            { type: 'updateExpanded', isExpanded: event.data.isExpanded },
            '*'
          );
        }
      });

      document.addEventListener('click', (event) => {
        if (
          !container.contains(event.target) &&
          !toggle.contains(event.target) &&
          container.classList.contains('visible')
        ) {
          toggleChat(container, toggle);
        }
      });
    } else {
      console.log(
        'Virto Assistant: Browser environment not detected. Skipping initialization.'
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVirtoAssistant);
  } else {
    initVirtoAssistant();
  }
})();
