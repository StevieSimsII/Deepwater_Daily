/**
 * Placard Scanner App
 * Captures photos of DOT hazmat placards, reads the UN/NA number via OCR,
 * and displays hazard information, pictogram meanings, and SDS links.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ── DOM References ──
  var cameraContainer = document.getElementById('cameraContainer');
  var cameraFeed = document.getElementById('cameraFeed');
  var captureCanvas = document.getElementById('captureCanvas');
  var capturedImage = document.getElementById('capturedImage');
  var cameraPlaceholder = document.getElementById('cameraPlaceholder');
  var cameraOverlay = document.getElementById('cameraOverlay');
  var btnStartCamera = document.getElementById('btnStartCamera');
  var btnCapture = document.getElementById('btnCapture');
  var btnRetake = document.getElementById('btnRetake');
  var unNumberInput = document.getElementById('unNumberInput');
  var btnLookup = document.getElementById('btnLookup');
  var scannerView = document.getElementById('scannerView');
  var processingView = document.getElementById('processingView');
  var processingText = document.getElementById('processingText');
  var resultsView = document.getElementById('resultsView');
  var notFoundView = document.getElementById('notFoundView');
  var notFoundText = document.getElementById('notFoundText');
  var substanceCard = document.getElementById('substanceCard');
  var pictogramList = document.getElementById('pictogramList');
  var sdsLinks = document.getElementById('sdsLinks');
  var emailInput = document.getElementById('emailInput');
  var btnEmail = document.getElementById('btnEmail');
  var btnCopy = document.getElementById('btnCopy');
  var btnScanNew = document.getElementById('btnScanNew');
  var btnTryAgain = document.getElementById('btnTryAgain');
  var themeToggle = document.getElementById('themeToggle');
  var toast = document.getElementById('toast');

  var cameraStream = null;
  var currentResult = null;

  // ── Theme Toggle ──
  function initTheme() {
    var saved = localStorage.getItem('placard-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    themeToggle.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
  }

  themeToggle.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('placard-theme', newTheme);
    updateThemeIcon();
  });

  // ── Camera ──
  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Camera not supported on this device. Use manual entry.', 'error');
      return;
    }
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    }).then(function (stream) {
      cameraStream = stream;
      cameraFeed.srcObject = stream;
      cameraContainer.classList.add('camera-active');
      cameraFeed.classList.remove('hidden');
      cameraPlaceholder.classList.add('hidden');
      cameraOverlay.classList.remove('hidden');
      btnStartCamera.classList.add('hidden');
      btnCapture.classList.remove('hidden');
      capturedImage.classList.add('hidden');
    }).catch(function (err) {
      console.error('Camera error:', err);
      showToast('Camera access denied. Use manual entry instead.', 'error');
    });
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (t) { t.stop(); });
      cameraStream = null;
    }
    cameraFeed.srcObject = null;
  }

  function capturePhoto() {
    var ctx = captureCanvas.getContext('2d');
    captureCanvas.width = cameraFeed.videoWidth;
    captureCanvas.height = cameraFeed.videoHeight;
    ctx.drawImage(cameraFeed, 0, 0);

    var dataUrl = captureCanvas.toDataURL('image/png');
    capturedImage.src = dataUrl;
    capturedImage.classList.remove('hidden');
    cameraFeed.classList.add('hidden');
    cameraOverlay.classList.add('hidden');
    btnCapture.classList.add('hidden');
    btnRetake.classList.remove('hidden');

    stopCamera();
    processImage(dataUrl);
  }

  function retakePhoto() {
    capturedImage.classList.add('hidden');
    btnRetake.classList.add('hidden');
    startCamera();
  }

  // ── OCR Processing ──
  function processImage(imageSource) {
    if (typeof Tesseract === 'undefined') {
      showToast('OCR engine not loaded. Please use manual entry.', 'error');
      showView('scanner');
      return;
    }

    showView('processing');
    processingText.textContent = 'Reading placard number...';

    Tesseract.recognize(imageSource, 'eng', {
      logger: function (info) {
        if (info.status === 'recognizing text') {
          var pct = Math.round(info.progress * 100);
          processingText.textContent = 'Reading placard... ' + pct + '%';
        }
      }
    }).then(function (result) {
      var text = result.data.text;
      console.log('OCR Result:', text);

      // Extract 4-digit numbers from OCR text
      var numbers = text.match(/\b\d{4}\b/g);

      if (numbers && numbers.length > 0) {
        // Use the first detected 4-digit number - works with any UN/NA number
        displayResults(numbers[0]);
      } else {
        showNotFound(null);
      }
    }).catch(function (err) {
      console.error('OCR Error:', err);
      showToast('Failed to read placard. Try manual entry.', 'error');
      showView('scanner');
    });
  }

  // ── Manual Lookup ──
  function manualLookup() {
    var num = unNumberInput.value.trim();
    if (!/^\d{4}$/.test(num)) {
      showToast('Please enter a valid 4-digit UN/NA number.', 'error');
      return;
    }
    // Accept any 4-digit UN/NA number
    displayResults(num);
  }

  // ── Display Results ──
  function displayResults(unNumber) {
    var substance = UN_NUMBERS[unNumber];
    var isUnknown = !substance;
    
    // Create generic substance info for unknown UN numbers
    if (isUnknown) {
      substance = {
        name: 'Unknown Hazardous Material (UN ' + unNumber + ')',
        class: '9',
        sds: 'hazardous-material',
        guide: null,
        isUnknown: true
      };
    }
    
    var hazardClass = HAZARD_CLASSES[substance.class];

    // Collect all applicable pictograms
    var pictogramKeys = [];
    var seen = {};
    if (hazardClass) {
      pictogramKeys.push(hazardClass.icon);
      seen[hazardClass.icon] = true;
    }
    if (substance.secondaryHazard) {
      substance.secondaryHazard.forEach(function (h) {
        var hc = HAZARD_CLASSES[h];
        if (hc && !seen[hc.icon]) {
          pictogramKeys.push(hc.icon);
          seen[hc.icon] = true;
        }
      });
    }

    // Store current result for email/copy
    currentResult = {
      unNumber: unNumber,
      substance: substance,
      hazardClass: hazardClass,
      pictogramKeys: pictogramKeys
    };

    // Substance card
    var secondaryBadges = '';
    if (substance.secondaryHazard) {
      substance.secondaryHazard.forEach(function (h) {
        var hc = HAZARD_CLASSES[h];
        if (hc) {
          secondaryBadges += '<span class="hazard-class-badge" style="background:' + hc.color + ';color:' + getContrastColor(hc.color) + '">' + hc.name + '</span>';
        }
      });
    }

    var guideHtml = substance.guide
      ? '<span class="erg-guide-badge">ERG Guide ' + substance.guide + '</span>'
      : '';

    var unknownWarning = substance.isUnknown
      ? '<div class="unknown-warning"><i class="bi bi-exclamation-triangle"></i> UN number not in local database. Use the SDS links below to identify this material. Treat as potentially hazardous.</div>'
      : '';

    substanceCard.innerHTML =
      '<div class="substance-header">' +
        '<div>' +
          '<div class="substance-name">' + substance.name + '</div>' +
          '<span class="hazard-class-badge" style="background:' + hazardClass.color + ';color:' + getContrastColor(hazardClass.color) + '">' +
            'Class ' + substance.class + ' - ' + hazardClass.name +
          '</span>' +
          secondaryBadges +
          guideHtml +
        '</div>' +
        '<span class="un-badge">UN ' + unNumber + '</span>' +
      '</div>' +
      unknownWarning;

    // Pictograms
    pictogramList.innerHTML = '';
    pictogramKeys.forEach(function (key) {
      var picto = GHS_PICTOGRAMS[key];
      if (!picto) return;

      var precautionHtml = '';
      picto.precautions.forEach(function (p) {
        precautionHtml += '<div class="precaution-item">' + p + '</div>';
      });

      var el = document.createElement('div');
      el.className = 'pictogram-item';
      el.innerHTML =
        '<div class="pictogram-icon" style="border-color:' + hazardClass.color + ';background:rgba(' + hexToRgb(hazardClass.color) + ',0.1)">' +
          getPictogramSVG(key) +
        '</div>' +
        '<div class="pictogram-details">' +
          '<h4>' + picto.name + '</h4>' +
          '<div class="meaning">' + picto.meaning + '</div>' +
          '<div class="precautions">' + precautionHtml + '</div>' +
        '</div>';
      pictogramList.appendChild(el);
    });

    // SDS links
    var sdsUrlList = getSDSUrls(substance, unNumber);
    var sdsHtml = '';
    sdsUrlList.forEach(function (link) {
      sdsHtml +=
        '<a href="' + link.url + '" target="_blank" rel="noopener noreferrer" class="sds-link">' +
          '<span>' + link.name + '</span>' +
          '<span class="arrow"><i class="bi bi-box-arrow-up-right"></i></span>' +
        '</a>';
    });
    sdsLinks.innerHTML = sdsHtml;

    showView('results');
  }

  function showNotFound(number) {
    if (number) {
      notFoundText.textContent = 'UN/NA number "' + number + '" was not found in our database. Please verify the number on the placard and try again, or enter it manually.';
    } else {
      notFoundText.textContent = 'Could not detect a 4-digit UN/NA number from the image. Please try again with better lighting, or enter the number manually.';
    }
    showView('notFound');
  }

  // ── View Management ──
  function showView(view) {
    scannerView.classList.toggle('hidden', view !== 'scanner');
    processingView.classList.toggle('hidden', view !== 'processing');
    resultsView.classList.toggle('hidden', view !== 'results');
    notFoundView.classList.toggle('hidden', view !== 'notFound');
  }

  function resetToScanner() {
    stopCamera();
    currentResult = null;
    cameraContainer.classList.remove('camera-active');
    capturedImage.classList.add('hidden');
    cameraFeed.classList.add('hidden');
    cameraPlaceholder.classList.remove('hidden');
    cameraOverlay.classList.add('hidden');
    btnStartCamera.classList.remove('hidden');
    btnCapture.classList.add('hidden');
    btnRetake.classList.add('hidden');
    unNumberInput.value = '';
    emailInput.value = '';
    showView('scanner');
  }

  // ── Email & Copy ──
  function buildDetailsText() {
    if (!currentResult) return '';
    var unNumber = currentResult.unNumber;
    var substance = currentResult.substance;
    var hazardClass = currentResult.hazardClass;
    var pictogramKeys = currentResult.pictogramKeys;

    var text = 'HAZMAT PLACARD DETAILS\n';
    text += '========================================\n\n';
    text += 'UN Number: ' + unNumber + '\n';
    text += 'Substance: ' + substance.name + '\n';
    text += 'Hazard Class: ' + substance.class + ' - ' + hazardClass.name + '\n';
    if (substance.guide) text += 'ERG Guide: ' + substance.guide + '\n';
    if (substance.secondaryHazard) {
      substance.secondaryHazard.forEach(function (h) {
        var hc = HAZARD_CLASSES[h];
        if (hc) text += 'Secondary Hazard: ' + hc.name + '\n';
      });
    }

    text += '\nHAZARD PICTOGRAMS\n';
    text += '------------------------------\n';
    pictogramKeys.forEach(function (key) {
      var picto = GHS_PICTOGRAMS[key];
      if (picto) {
        text += '\n' + picto.name + '\n';
        text += 'Meaning: ' + picto.meaning + '\n';
        text += 'Precautions:\n';
        picto.precautions.forEach(function (p) { text += '  - ' + p + '\n'; });
      }
    });

    text += '\nSAFETY DATA SHEET LINKS\n';
    text += '------------------------------\n';
    var sdsUrlList = getSDSUrls(substance, unNumber);
    sdsUrlList.forEach(function (link) {
      text += link.name + ': ' + link.url + '\n';
    });

    text += '\n========================================\n';
    text += 'Generated by Deepwater Daily - Placard Scanner\n';
    return text;
  }

  function sendEmail() {
    var email = emailInput.value.trim();
    if (!email) {
      showToast('Please enter an email address.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    var subject = encodeURIComponent('Hazmat Placard Info - UN ' + currentResult.unNumber + ' - ' + currentResult.substance.name);
    var body = encodeURIComponent(buildDetailsText());
    window.location.href = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
    showToast('Opening email client...', 'success');
  }

  function copyToClipboard() {
    var text = buildDetailsText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Details copied to clipboard!', 'success');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Details copied to clipboard!', 'success');
    } catch (e) {
      showToast('Copy failed. Please copy manually.', 'error');
    }
    document.body.removeChild(ta);
  }

  // ── Toast ──
  function showToast(message, type) {
    toast.textContent = message;
    toast.className = 'toast ' + (type || 'success') + ' show';
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  // ── Helpers ──
  function getContrastColor(hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return parseInt(hex.substr(0, 2), 16) + ',' + parseInt(hex.substr(2, 2), 16) + ',' + parseInt(hex.substr(4, 2), 16);
  }

  function getPictogramSVG(type) {
    var svgs = {
      'exploding-bomb': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 2C7.36 2 4 5.36 4 9.5c0 2.59 1.32 4.87 3.32 6.22L8.5 22h7l1.18-6.28C18.68 14.37 20 12.09 20 9.5 20 5.36 16.64 2 12.5 2h-1zm.5 3a1 1 0 110 2 1 1 0 010-2zm-3 4h6l-.5 5h-5L9 9z"/></svg>',
      'flame': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1 4-4 6-4 10a4 4 0 008 0c0-4-3-6-4-10zm0 14a2 2 0 01-2-2c0-1.5 1-2.5 2-4 1 1.5 2 2.5 2 4a2 2 0 01-2 2z"/></svg>',
      'flame-over-circle': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4c-.7 2.8-2.8 4.2-2.8 7a2.8 2.8 0 005.6 0c0-2.8-2.1-4.2-2.8-7zM12 16a8 8 0 100-1 8 8 0 000 1zm0 2a6 6 0 110-12 6 6 0 010 12z"/></svg>',
      'gas-cylinder': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2v2H9a2 2 0 00-2 2v12a4 4 0 008 0V6a2 2 0 00-2-2h-1V2h-2zm-1 6h6v8a2 2 0 01-4 0h-2v-8z"/></svg>',
      'corrosion': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L8 8h2v3c-2 1-4 3-4 6 0 3.31 2.69 5 6 5s6-1.69 6-5c0-3-2-5-4-6V8h2L12 2zm-1 15c-1.1 0-2-.45-2-1s.9-1 2-1 2 .45 2 1-.9 1-2 1z"/></svg>',
      'skull-crossbones': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17h2v-1h4v1h2v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zM9 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-6 7h2v2H9v-2zm4 0h2v2h-2v-2z"/></svg>',
      'exclamation': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>',
      'health-hazard': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 4l1.5 3H17l-2.75 2 1 3.25L12 12.5l-3.25 1.75 1-3.25L7 9h3.5L12 6z"/></svg>',
      'biohazard': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a4 4 0 00-3.46 6 4 4 0 00-2.54 5 4 4 0 006 2 4 4 0 006 0 4 4 0 00-2.54-5A4 4 0 0012 2zm0 6a2 2 0 110-4 2 2 0 010 4zm-4 6a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4z"/></svg>',
      'radioactive': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.5 0 2.81.56 3.89 1.44L12 12l-3.89-4.56A5.96 5.96 0 0112 6zm-6 6c0-1.5.56-2.81 1.44-3.89L12 12l-4.56 3.89A5.96 5.96 0 016 12zm6 6c-1.5 0-2.81-.56-3.89-1.44L12 12l3.89 4.56A5.96 5.96 0 0112 18z"/></svg>',
      'environment': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
    };
    return svgs[type] || '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
  }

  // ── Event Listeners ──
  btnStartCamera.addEventListener('click', startCamera);
  btnCapture.addEventListener('click', capturePhoto);
  btnRetake.addEventListener('click', retakePhoto);
  btnLookup.addEventListener('click', manualLookup);
  btnScanNew.addEventListener('click', resetToScanner);
  btnTryAgain.addEventListener('click', resetToScanner);
  btnEmail.addEventListener('click', sendEmail);
  btnCopy.addEventListener('click', copyToClipboard);

  unNumberInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') manualLookup();
  });

  // Only allow digits in the UN number input
  unNumberInput.addEventListener('input', function () {
    unNumberInput.value = unNumberInput.value.replace(/\D/g, '');
  });

  // ── Init ──
  initTheme();
});
