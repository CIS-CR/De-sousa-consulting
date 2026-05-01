(() => {
  const form = document.getElementById("leadForm");
  if (!form) return;

  const statusEl = document.getElementById("formStatus");
  const countrySelect = document.getElementById("country");
  const countryOtherInput = document.getElementById("countryOther");

  const ENDPOINT =
  window.FBOS_ENDPOINT ||
  window.FBOS_CONFIG?.endpoint ||
  "https://api.fbos.org/api/demos/de-sousa-consulting/submit";

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

  function getTurnstileToken() {
    try {
      const formData = new FormData(form);
      const token = String(formData.get("cf-turnstile-response") || "").trim();
      if (token) return token;
    } catch {}

    const tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
    return String(tokenInput?.value || "").trim();
  }

  function buildPayload(turnstileToken = "") {
    const country = getFieldValue("country");
    const countryOther = getFieldValue("countryOther");
    const name = getFieldValue("name");
    const email = getFieldValue("email");
    const industry = getFieldValue("industry");
    const teamSize = getFieldValue("teamSize");
    const pain = getFieldValue("pain");
    const category = getFieldValue("category") || DEFAULT_CATEGORY;
    const requestType = getFieldValue("requestType") || DEFAULT_REQUEST_TYPE;
    const demoVertical = getFieldValue("demoVertical") || "home";
    const serviceOrigin = getFieldValue("serviceOrigin") || demoVertical;

    const resolvedCountry =
      country === "Otro" || country === "Other" || country === "Outro"
        ? countryOther
        : country;

    const payload = {
      name,
      email,
      industry,
      teamSize,
      pain,
      country: resolvedCountry,
      category,
      requestType,
      demoVertical,
      serviceOrigin,
      source: DEFAULT_SOURCE,
      client_ts: new Date().toISOString(),
      user_agent: navigator.userAgent,
      customer_name: name,
      customer_email: email,
      description: pain,
      location: resolvedCountry,
      request_type: requestType,
    };

    if (turnstileToken) {
      payload.turnstile_token = turnstileToken;
      payload.cf_turnstile_response = turnstileToken;
      payload.turnstile_response = turnstileToken;
      payload["cf-turnstile-response"] = turnstileToken;
    }

    return payload;
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

    try {
      if (window.turnstile && typeof window.turnstile.reset === "function") {
        const turnstileNode = form.querySelector(".cf-turnstile");
        const widgetId = turnstileNode?.dataset?.widgetId || "";
        if (widgetId) window.turnstile.reset(widgetId);
        else window.turnstile.reset();
      }
    } catch {}
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

      const turnstileToken = getTurnstileToken();
      if (!turnstileToken) {
        throw new Error("Por favor complete la verificación de seguridad.");
      }

      setStatus("Enviando información...", "loading");

      const payload = buildPayload(turnstileToken);
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
