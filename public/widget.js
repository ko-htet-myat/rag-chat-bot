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

    var maximizeSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
    var minimizeSvg =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
    var isFullscreen = false;

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
    chatWindow.style.transition =
      "width 0.2s ease, height 0.2s ease, border-radius 0.2s ease";

    // Header
    var header = document.createElement("div");
    header.style.backgroundColor = themeColor;
    header.style.padding = "14px 18px";
    header.style.color = "#ffffff";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.boxSizing = "border-box";
    header.style.flexShrink = "0";
    header.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
      '<div style="font-weight:600;font-size:15px;letter-spacing:0.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      escapeHtml(displayName) +
      "</div>" +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:4px;shrink:0;">' +
      '<button id="inno-chat-fullscreen-btn" type="button" aria-label="Full screen" title="Full screen" style="background:transparent;border:none;color:#fff;cursor:pointer;opacity:0.85;padding:5px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:opacity 0.2s,background-color 0.2s;">' +
      maximizeSvg +
      "</button>" +
      '<button id="inno-chat-close-btn" type="button" aria-label="Close chat" title="Close" style="background:transparent;border:none;color:#fff;cursor:pointer;opacity:0.85;padding:5px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:opacity 0.2s,background-color 0.2s;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      "</button>" +
      "</div>";

    // Messages Area
    var messagesArea = document.createElement("div");
    messagesArea.style.flex = "1";
    messagesArea.style.padding = "16px";
    messagesArea.style.overflowY = "auto";
    messagesArea.style.display = "flex";
    messagesArea.style.flexDirection = "column";
    messagesArea.style.backgroundColor = "#111322";
    messagesArea.style.boxSizing = "border-box";

    var messagesInner = document.createElement("div");
    messagesInner.style.width = "100%";
    messagesInner.style.maxWidth = "100%";
    messagesInner.style.display = "flex";
    messagesInner.style.flexDirection = "column";
    messagesInner.style.gap = "12px";
    messagesInner.style.boxSizing = "border-box";
    messagesArea.appendChild(messagesInner);

    // Add Welcome message
    appendMessage("assistant", welcomeMsg);

    // Footer / Input Area
    var footer = document.createElement("form");
    footer.style.display = "flex";
    footer.style.flexDirection = "column";
    footer.style.alignItems = "center";
    footer.style.padding = "10px 12px 6px";
    footer.style.backgroundColor = "#161828";
    footer.style.borderTop = "1px solid rgba(255,255,255,0.08)";
    footer.style.boxSizing = "border-box";
    footer.style.flexShrink = "0";

    var footerInner = document.createElement("div");
    footerInner.style.display = "flex";
    footerInner.style.gap = "8px";
    footerInner.style.width = "100%";
    footerInner.style.maxWidth = "100%";
    footerInner.style.boxSizing = "border-box";

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

    footerInner.appendChild(input);
    footerInner.appendChild(sendBtn);

    var branding = document.createElement("div");
    branding.style.margin = "6px auto";
    branding.style.fontSize = "11px";
    branding.style.color = "#64748b";
    branding.style.textAlign = "center";
    branding.style.userSelect = "none";
    branding.style.width = "100%";
    branding.style.boxSizing = "border-box";
    branding.innerHTML =
      'Powered by <a href="' +
      escapeHtml(baseUrl) +
      '" target="_blank" rel="noopener noreferrer" style="color:#818cf8;text-decoration:none;font-weight:500;">Inno Chat</a>';

    footer.appendChild(footerInner);
    footer.appendChild(branding);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesArea);
    chatWindow.appendChild(footer);

    host.appendChild(chatWindow);
    host.appendChild(launcher);

    var fullscreenBtn = header.querySelector("#inno-chat-fullscreen-btn");
    var closeBtn = header.querySelector("#inno-chat-close-btn");

    if (fullscreenBtn) {
      fullscreenBtn.onmouseenter = function () {
        fullscreenBtn.style.opacity = "1";
        fullscreenBtn.style.backgroundColor = "rgba(255,255,255,0.15)";
      };
      fullscreenBtn.onmouseleave = function () {
        fullscreenBtn.style.opacity = "0.85";
        fullscreenBtn.style.backgroundColor = "transparent";
      };
    }
    if (closeBtn) {
      closeBtn.onmouseenter = function () {
        closeBtn.style.opacity = "1";
        closeBtn.style.backgroundColor = "rgba(255,255,255,0.15)";
      };
      closeBtn.onmouseleave = function () {
        closeBtn.style.opacity = "0.85";
        closeBtn.style.backgroundColor = "transparent";
      };
    }

    function setFullscreen(enable) {
      isFullscreen = Boolean(enable);
      if (isFullscreen) {
        chatWindow.style.position = "fixed";
        chatWindow.style.top = "0";
        chatWindow.style.left = "0";
        chatWindow.style.right = "0";
        chatWindow.style.bottom = "0";
        chatWindow.style.width = "100vw";
        chatWindow.style.maxWidth = "100vw";
        chatWindow.style.height = "100vh";
        chatWindow.style.maxHeight = "100vh";
        chatWindow.style.borderRadius = "0";
        chatWindow.style.border = "none";
        chatWindow.style.boxShadow = "none";
        chatWindow.style.zIndex = "2147483647";
        launcher.style.display = "none";
        if (fullscreenBtn) {
          fullscreenBtn.innerHTML = minimizeSvg;
          fullscreenBtn.setAttribute("aria-label", "Exit full screen");
          fullscreenBtn.setAttribute("title", "Exit full screen");
        }
        messagesInner.style.maxWidth = "800px";
        messagesInner.style.margin = "0 auto";
        footerInner.style.maxWidth = "800px";
        footerInner.style.margin = "0 auto";
        branding.style.maxWidth = "800px";
        branding.style.margin = "6px auto";
      } else {
        chatWindow.style.position = "absolute";
        chatWindow.style.top = "";
        chatWindow.style.bottom = "75px";
        if (isRight) {
          chatWindow.style.right = "0";
          chatWindow.style.left = "";
        } else {
          chatWindow.style.left = "0";
          chatWindow.style.right = "";
        }
        chatWindow.style.width = "360px";
        chatWindow.style.maxWidth = "calc(100vw - 48px)";
        chatWindow.style.height = "520px";
        chatWindow.style.maxHeight = "calc(100vh - 120px)";
        chatWindow.style.borderRadius = "16px";
        chatWindow.style.border = "1px solid rgba(255,255,255,0.12)";
        chatWindow.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)";
        if (isOpen) {
          launcher.style.display = "flex";
        }
        if (fullscreenBtn) {
          fullscreenBtn.innerHTML = maximizeSvg;
          fullscreenBtn.setAttribute("aria-label", "Full screen");
          fullscreenBtn.setAttribute("title", "Full screen");
        }
        messagesInner.style.maxWidth = "100%";
        messagesInner.style.margin = "0";
        footerInner.style.maxWidth = "100%";
        footerInner.style.margin = "0";
        branding.style.maxWidth = "100%";
        branding.style.margin = "6px auto";
      }
    }

    if (fullscreenBtn) {
      fullscreenBtn.onclick = function (e) {
        e.stopPropagation();
        setFullscreen(!isFullscreen);
        setTimeout(function () {
          input.focus();
        }, 50);
      };
    }

    // Escape key listener to exit fullscreen
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen && isFullscreen) {
        setFullscreen(false);
      }
    });

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
      if (!isOpen && isFullscreen) {
        setFullscreen(false);
      }
      if (isOpen) {
        setTimeout(function () {
          input.focus();
        }, 50);
      }
    };

    if (closeBtn) {
      closeBtn.onclick = function () {
        if (isFullscreen) {
          setFullscreen(false);
        }
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
                if (!responseText.trim()) {
                  assistantBubble.innerHTML =
                    "Sorry, no response was generated. Please try again or check your account credits.";
                }
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
      messagesInner.appendChild(msg);
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
      messagesInner.appendChild(msg);
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
