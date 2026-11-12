import 'dotenv/config';

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com',
} = process.env;

async function getAccessToken() {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal token error: ${data.error_description || JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function paypalRequest(path, method = 'GET', body = null, extraHeaders = {}) {
  const accessToken = await getAccessToken();
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${PAYPAL_BASE_URL}${path}`, options);
  // 204 No Content (void returns empty)
  if (res.status === 204) return {};
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal API error [${res.status}]: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

export async function createOrder(jobId, totalAmount, currency, returnUrl, cancelUrl) {
  const data = await paypalRequest('/v2/checkout/orders', 'POST', {
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: totalAmount.toFixed(2),
        },
        custom_id: jobId,
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  });

  const approveLink = data.links?.find((l) => l.rel === 'approve')?.href;
  if (!approveLink) throw new Error('PayPal: no approve link returned');

  return { orderId: data.id, approveLink };
}

export async function authorizeOrder(orderId) {
  const data = await paypalRequest(`/v2/checkout/orders/${orderId}/authorize`, 'POST', {});
  const auth = data.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!auth) throw new Error('PayPal: no authorization returned');
  return { authId: auth.id, status: auth.status };
}

export async function captureAuthorization(authId, amount, currency, isFinal = false) {
  const data = await paypalRequest(
    `/v2/payments/authorizations/${authId}/capture`,
    'POST',
    {
      amount: {
        value: amount.toFixed(2),
        currency_code: currency,
      },
      final_capture: isFinal,
    }
  );
  return data;
}

export async function voidAuthorization(authId) {
  const data = await paypalRequest(`/v2/payments/authorizations/${authId}/void`, 'POST', {});
  return data;
}
