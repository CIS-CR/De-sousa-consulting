(() => {
  const form = document.getElementById("leadForm");
  if (!form) return;

  const statusEl = document.getElementById("formStatus");
  const countrySelect = document.getElementById("country");
  const countryOtherInput = document.getElementById("countryOther");

  const ENDPOINT =
    window.FBOS_ENDPOINT ||
    window.FBOS_CONFIG?.endpoint ||
    "/api/demos/implementations/submit";

  const DEFAULT_SOURCE = "desousa-home";
  const DEFAULT_CATEGORY = "strategic-assessment";
  const DEFAULT_REQUEST_TYPE = "evaluation";

  function setStatus(message, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = type;
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.textContent = "";
    delete statusEl.dataset.state;
  }

  function toggleCountryOther() {
    if (!countrySelect || !countryOtherInput) return;

    const showOther =
      countrySelect.value === "Otro" ||
      countrySelect.value === "Other" ||
      countrySelect.value === "Outro";

    countryOtherInput.hidden = !showOther;
    countryOtherInput.required = showOther;

    if (!showOther) {
      countryOtherInput.value = "";
    }
  }

  function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateForm() {
    const name = getFieldValue("name");
    const email = getFieldValue("email");
    const industry = getFieldValue("industry");
    const pain = getFieldValue("pain");
    const country = getFieldValue("country");
    const countryOther = getFieldValue("countryOther");

    if (!name) return "Por favor ingrese su nombre.";
    if (!email) return "Por favor ingrese su email.";
    if (!validateEmail(email)) return "Por favor ingrese un email válido.";
    if (!industry) return "Por favor ingrese empresa / industria.";
    if (!pain) return "Por favor describa su necesidad principal.";
    if (!country) return "Por favor seleccione un país.";

    const isOther =
      country === "Otro" || country === "Other" || country === "Outro";

    if (isOther && !countryOther) {
      return "Por favor especifique su país.";
    }

    return null;
  }

  function buildPayload() {
    const country = getFieldValue("country");
    const countryOther = getFieldValue("countryOther");

    const resolvedCountry =
      country === "Otro" || country === "Other" || country === "Outro"
        ? countryOther
        : country;

    return {
      name: getFieldValue("name"),
      email: getFieldValue("email"),
      industry: getFieldValue("industry"),
      teamSize: getFieldValue("teamSize"),
      pain: getFieldValue("pain"),
      country: resolvedCountry,
      category: getFieldValue("category") || DEFAULT_CATEGORY,
      requestType: getFieldValue("requestType") || DEFAULT_REQUEST_TYPE,
      demoVertical: getFieldValue("demoVertical") || "home",
      source: DEFAULT_SOURCE,
      client_ts: new Date().toISOString(),
      user_agent: navigator.userAgent,
    };
  }

  async function submitForm(payload) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.error || "No fue posible enviar la información. Intente nuevamente."
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || "No fue posible procesar la solicitud.");
    }

    return data;
  }

  function resetFormState() {
    form.reset();
    toggleCountryOther();

    const demoVertical = document.getElementById("demoVertical");
    const requestType = document.getElementById("requestType");
    const serviceOrigin = document.getElementById("serviceOrigin");
    const selectedServiceNote = document.getElementById("selectedServiceNote");
    const selectedServiceLabel = document.getElementById("selectedServiceLabel");

    if (demoVertical) demoVertical.value = "home";
    if (requestType) requestType.value = "evaluation";
    if (serviceOrigin) serviceOrigin.value = "home";

    if (selectedServiceNote) selectedServiceNote.hidden = true;
    if (selectedServiceLabel) selectedServiceLabel.textContent = "General";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearStatus();

    const validationError = validateForm();
    if (validationError) {
      setStatus(validationError, "error");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }

      setStatus("Enviando información...", "loading");

      const payload = buildPayload();
      const result = await submitForm(payload);

      setStatus(
        result?.action_id
          ? `Información enviada correctamente. ID: ${result.action_id}`
          : "Información enviada correctamente.",
        "success"
      );

      resetFormState();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al enviar la información.",
        "error"
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText || "Iniciar diagnóstico";
      }
    }
  }

  countrySelect?.addEventListener("change", toggleCountryOther);
  toggleCountryOther();

  form.addEventListener("submit", handleSubmit);
})();
