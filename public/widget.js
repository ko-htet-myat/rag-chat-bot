(function () {
  "use strict";

  // Prevent multiple initializations
  if (window.__INNO_CHATBOT_INITIALIZED__) {
    return;
  }
  window.__INNO_CHATBOT_INITIALIZED__ = true;

  // 1. Locate current script tag and read attributes
  function findScriptTag() {
    if (document.currentScript) {
      return document.currentScript;
    }
    // Query by data-public-key attribute
    var byKey = document.querySelector("script[data-public-key]");
    if (byKey) return byKey;

    // Search by src containing widget.js
    var all = document.querySelectorAll("script");
    for (var i = all.length - 1; i >= 0; i--) {
      var s = all[i];
      if (s.src && s.src.indexOf("widget.js") !== -1) {
        return s;
      }
    }
    return null;
  }

  var scriptTag = findScriptTag();
  var publicKey =
    (scriptTag && scriptTag.getAttribute("data-public-key")) ||
    window.__INNO_CHATBOT_KEY__ ||
    window.innoChatBotKey;

  if (!publicKey) {
    console.error(
      "[InnoChatBot] Missing 'data-public-key' attribute on widget script tag. Please verify your snippet.",
    );
    return;
  }

  // Derive API base URL:
  // 1. Explicit data-api-base attribute
  // 2. Origin from the script tag's src URL
  // 3. Fallback to current window.location.origin
  var explicitApiBase =
    scriptTag &&
    (scriptTag.getAttribute("data-api-base") ||
      scriptTag.getAttribute("data-host"));

  var apiBase = "";
  if (explicitApiBase) {
    apiBase = explicitApiBase.replace(/\/+$/, "");
  } else if (
    scriptTag &&
    scriptTag.src &&
    /^https?:\/\//i.test(scriptTag.src)
  ) {
    try {
      apiBase = new URL(scriptTag.src).origin;
    } catch {
      apiBase = window.location.origin;
    }
  } else {
    apiBase = window.location.origin;
  }

  var isDebug = scriptTag && scriptTag.getAttribute("data-debug") === "true";

  // 2. Fetch widget configuration
  fetch(apiBase + "/api/widget/config?key=" + encodeURIComponent(publicKey))
    .then(function (res) {
      if (!res.ok) {
        throw new Error(
          "Server responded with status " +
            res.status +
            " " +
            res.statusText +
            ". Check if your backend is running at " +
            apiBase +
            " and public key exists in DB.",
        );
      }
      return res.json();
    })
    .then(function (config) {
      if (!config.enabled) {
        console.warn(
          "[InnoChatBot] Widget is set to 'Disabled' in your dashboard. Enable it to make it visible on your website.",
        );
        return;
      }
      initWidget(config, apiBase, publicKey);
    })
    .catch(function (err) {
      if (isDebug) {
        console.error("[InnoChatBot] Failed to initialize:", err);
      }
    });

  function initWidget(config, baseUrl, key) {
    var isRight = config.position !== "bottom-left";
    var themeColor = config.themeColor || "#6366f1";
    var displayName = config.displayName || config.botName || "Chat Support";
    var welcomeMsg =
      config.welcomeMessage || "Hi there! How can I help you today? 👋";
    var conversationId = null;
    var isOpen = false;

    // Root Container
    var host = document.createElement("div");
    host.id = "inno-chatbot-widget-root";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647"; // Max 32-bit int z-index
    host.style.bottom = "24px";
    if (isRight) {
      host.style.right = "24px";
    } else {
      host.style.left = "24px";
    }
    host.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    host.style.boxSizing = "border-box";

    // Launcher Button
    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.style.width = "60px";
    launcher.style.height = "60px";
    launcher.style.borderRadius = "30px";
    launcher.style.backgroundColor = themeColor;
    launcher.style.color = "#ffffff";
    launcher.style.border = "none";
    launcher.style.outline = "none";
    launcher.style.cursor = "pointer";
    launcher.style.display = "flex";
    launcher.style.alignItems = "center";
    launcher.style.justifyContent = "center";
    launcher.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
    launcher.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    launcher.style.boxSizing = "border-box";
    launcher.setAttribute("aria-label", "Open chat widget");
    launcher.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

    launcher.onmouseenter = function () {
      launcher.style.transform = "scale(1.06)";
    };
    launcher.onmouseleave = function () {
      launcher.style.transform = "scale(1)";
    };

    // Chat Window
    var chatWindow = document.createElement("div");
    chatWindow.style.display = "none";
    chatWindow.style.flexDirection = "column";
    chatWindow.style.position = "absolute";
    chatWindow.style.bottom = "75px";
    if (isRight) {
      chatWindow.style.right = "0";
    } else {
      chatWindow.style.left = "0";
    }
    chatWindow.style.width = "360px";
    chatWindow.style.maxWidth = "calc(100vw - 48px)";
    chatWindow.style.height = "520px";
    chatWindow.style.maxHeight = "calc(100vh - 120px)";
    chatWindow.style.backgroundColor = "#161828";
    chatWindow.style.borderRadius = "16px";
    chatWindow.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)";
    chatWindow.style.border = "1px solid rgba(255,255,255,0.12)";
    chatWindow.style.overflow = "hidden";
    chatWindow.style.boxSizing = "border-box";

    // Header
    var header = document.createElement("div");
    header.style.backgroundColor = themeColor;
    header.style.padding = "14px 18px";
    header.style.color = "#ffffff";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.boxSizing = "border-box";
    header.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
      '<div style="width:10px;height:10px;border-radius:5px;background:#10b981;box-shadow:0 0 6px #10b981;shrink:0;"></div>' +
      '<div style="font-weight:600;font-size:15px;letter-spacing:0.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      escapeHtml(displayName) +
      "</div>" +
      "</div>" +
      '<button id="inno-chat-close-btn" type="button" style="background:transparent;border:none;color:#fff;cursor:pointer;opacity:0.85;padding:4px;display:flex;align-items:center;justify-content:center;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      "</button>";

    // Messages Area
    var messagesArea = document.createElement("div");
    messagesArea.style.flex = "1";
    messagesArea.style.padding = "16px";
    messagesArea.style.overflowY = "auto";
    messagesArea.style.display = "flex";
    messagesArea.style.flexDirection = "column";
    messagesArea.style.gap = "12px";
    messagesArea.style.backgroundColor = "#111322";
    messagesArea.style.boxSizing = "border-box";

    // Add Welcome message
    appendMessage("assistant", welcomeMsg);

    // Footer / Input Area
    var footer = document.createElement("form");
    footer.style.display = "flex";
    footer.style.padding = "12px";
    footer.style.backgroundColor = "#161828";
    footer.style.borderTop = "1px solid rgba(255,255,255,0.08)";
    footer.style.gap = "8px";
    footer.style.boxSizing = "border-box";

    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    input.style.flex = "1";
    input.style.padding = "10px 14px";
    input.style.backgroundColor = "#0d0f1b";
    input.style.border = "1px solid rgba(255,255,255,0.12)";
    input.style.borderRadius = "10px";
    input.style.color = "#ffffff";
    input.style.fontSize = "13px";
    input.style.outline = "none";
    input.style.boxSizing = "border-box";

    var sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.style.backgroundColor = themeColor;
    sendBtn.style.color = "#ffffff";
    sendBtn.style.border = "none";
    sendBtn.style.borderRadius = "10px";
    sendBtn.style.width = "40px";
    sendBtn.style.height = "40px";
    sendBtn.style.display = "flex";
    sendBtn.style.alignItems = "center";
    sendBtn.style.justifyContent = "center";
    sendBtn.style.cursor = "pointer";
    sendBtn.style.boxSizing = "border-box";
    sendBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';

    footer.appendChild(input);
    footer.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesArea);
    chatWindow.appendChild(footer);

    host.appendChild(chatWindow);
    host.appendChild(launcher);

    // Safe mount into document body
    function mount() {
      if (document.body) {
        document.body.appendChild(host);
      } else {
        window.addEventListener("DOMContentLoaded", function () {
          if (document.body) document.body.appendChild(host);
        });
      }
    }
    mount();

    // Toggle event
    launcher.onclick = function () {
      isOpen = !isOpen;
      chatWindow.style.display = isOpen ? "flex" : "none";
      if (isOpen) {
        setTimeout(function () {
          input.focus();
        }, 50);
      }
    };

    var closeBtn = header.querySelector("#inno-chat-close-btn");
    if (closeBtn) {
      closeBtn.onclick = function () {
        isOpen = false;
        chatWindow.style.display = "none";
      };
    }

    // Message submit event
    footer.onsubmit = function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      appendMessage("user", text);
      input.value = "";

      var typingIndicator = appendTypingIndicator();

      var payload = {
        publicKey: key,
        message: text,
      };
      if (conversationId) {
        payload.conversationId = conversationId;
      }

      fetch(baseUrl + "/api/widget/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) {
            return res.text().then(function (body) {
              throw new Error("HTTP " + res.status + (body ? ": " + body : ""));
            });
          }
          var nextConversationId = res.headers.get("X-Conversation-Id");
          if (nextConversationId) {
            conversationId = nextConversationId;
          }

          if (!res.body) {
            throw new Error("Streaming is not supported by this browser");
          }

          // Remove typing indicator as soon as assistant response starts
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
            typingIndicator = null;
          }

          var reader = res.body.getReader();
          var decoder = new TextDecoder();
          var assistantMessage = appendMessage("assistant", "");
          var assistantBubble = assistantMessage.firstChild;
          var responseText = "";
          var scrollScheduled = false;

          function scheduleScroll() {
            if (!scrollScheduled) {
              scrollScheduled = true;
              window.requestAnimationFrame(function () {
                messagesArea.scrollTop = messagesArea.scrollHeight;
                scrollScheduled = false;
              });
            }
          }

          function readChunk() {
            return reader.read().then(function (result) {
              if (result.done) {
                messagesArea.scrollTop = messagesArea.scrollHeight;
                return;
              }

              responseText += decoder.decode(result.value, { stream: true });
              assistantBubble.innerHTML = renderMarkdown(responseText);
              scheduleScroll();
              return readChunk();
            });
          }

          return readChunk();
        })
        .then(function () {
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
        })
        .catch(function (err) {
          if (isDebug) {
            console.error("[InnoChatBot] Chat error:", err);
          }
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
          appendMessage(
            "assistant",
            "Sorry, I encountered an issue reaching the server. Please try again.",
          );
        });
    };

    function renderMarkdown(markdown) {
      if (!markdown) return "";

      var normalized = String(markdown).replace(/\r\n/g, "\n").trim();
      if (!normalized) return "";

      var blocks = normalized.split(/\n\s*\n/);
      var htmlBlocks = [];

      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i].trim();
        if (!block) continue;

        if (block.startsWith("```")) {
          var codeMatch = block.match(/^```[\s\S]*?\n([\s\S]*?)\n?```$/);
          var code = codeMatch ? codeMatch[1] : block.slice(3, -3);
          htmlBlocks.push(
            '<pre style="margin:0;white-space:pre-wrap;overflow-x:auto;background:#0b1020;border-radius:8px;padding:10px 12px;border:1px solid rgba(255,255,255,0.08);"><code>' +
              escapeHtml(code).replace(/\n/g, "<br>") +
              "</code></pre>",
          );
          continue;
        }

        if (/^#{1,6}\s+/.test(block)) {
          var level = Math.min(6, (block.match(/^#+/) || [""])[0].length);
          var heading = block.replace(/^#{1,6}\s+/, "");
          htmlBlocks.push(
            "<h" +
              level +
              ' style="margin:0 0 8px 0;font-size:13px;font-weight:700;line-height:1.4;">' +
              formatInline(heading) +
              "</h" +
              level +
              ">",
          );
          continue;
        }

        if (/^(?:[-*])\s+/.test(block)) {
          var listItems = block.split(/\n/).map(function (line) {
            return line.replace(/^(?:[-*])\s+/, "");
          });
          htmlBlocks.push(
            '<ul style="margin:0 0 8px 0;padding-left:18px;">' +
              listItems
                .map(function (item) {
                  return (
                    '<li style="margin:4px 0;">' + formatInline(item) + "</li>"
                  );
                })
                .join("") +
              "</ul>",
          );
          continue;
        }

        if (/^\d+\.\s+/.test(block)) {
          var orderedItems = block.split(/\n/).map(function (line) {
            return line.replace(/^\d+\.\s+/, "");
          });
          htmlBlocks.push(
            '<ol style="margin:0 0 8px 0;padding-left:18px;">' +
              orderedItems
                .map(function (item) {
                  return (
                    '<li style="margin:4px 0;">' + formatInline(item) + "</li>"
                  );
                })
                .join("") +
              "</ol>",
          );
          continue;
        }

        htmlBlocks.push(
          '<p style="margin:0 0 8px 0;">' + formatInline(block) + "</p>",
        );
      }

      return htmlBlocks.join("");
    }

    function formatInline(text) {
      var formatted = escapeHtml(text);
      formatted = formatted
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
        )
        .replace(
          /`([^`]+)`/g,
          '<code style="background:rgba(148,163,184,0.12);padding:2px 6px;border-radius:6px;">$1</code>',
        )
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_(.+?)_/g, "<em>$1</em>");
      return formatted.replace(/\n/g, "<br>");
    }

    function appendMessage(role, content) {
      var msg = document.createElement("div");
      msg.style.display = "flex";
      msg.style.flexDirection = "column";
      msg.style.alignItems = role === "user" ? "flex-end" : "flex-start";

      var bubble = document.createElement("div");
      bubble.style.padding = "10px 14px";
      bubble.style.borderRadius = "14px";
      bubble.style.fontSize = "13px";
      bubble.style.lineHeight = "1.45";
      bubble.style.maxWidth = "80%";
      bubble.style.wordBreak = "break-word";
      bubble.style.boxSizing = "border-box";
      bubble.style.whiteSpace = "normal";

      if (role === "user") {
        bubble.style.backgroundColor = themeColor;
        bubble.style.color = "#ffffff";
        bubble.style.borderBottomRightRadius = "2px";
      } else {
        bubble.style.backgroundColor = "#1e2238";
        bubble.style.color = "#e2e8f0";
        bubble.style.border = "1px solid rgba(255,255,255,0.06)";
        bubble.style.borderBottomLeftRadius = "2px";
      }

      if (role === "user") {
        bubble.textContent = content;
      } else {
        bubble.innerHTML = renderMarkdown(content);
      }
      msg.appendChild(bubble);
      messagesArea.appendChild(msg);
      messagesArea.scrollTop = messagesArea.scrollHeight;
      return msg;
    }

    function appendTypingIndicator() {
      var msg = document.createElement("div");
      msg.style.display = "flex";
      msg.style.alignItems = "flex-start";

      var bubble = document.createElement("div");
      bubble.style.padding = "8px 12px";
      bubble.style.borderRadius = "14px";
      bubble.style.fontSize = "12px";
      bubble.style.backgroundColor = "#1e2238";
      bubble.style.color = "#94a3b8";
      bubble.style.border = "1px solid rgba(255,255,255,0.06)";
      bubble.style.boxSizing = "border-box";
      bubble.textContent = "Typing...";

      msg.appendChild(bubble);
      messagesArea.appendChild(msg);
      messagesArea.scrollTop = messagesArea.scrollHeight;
      return msg;
    }

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
  }
})();
