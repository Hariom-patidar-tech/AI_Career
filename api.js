const BASE_URL = 'http://127.0.0.1:8000';

// ── Helpers ──────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('caai_token') || '';
}

function setToken(t) {
  localStorage.setItem('caai_token', t);
}

function removeToken() {
  localStorage.removeItem('caai_token');
}

async function request(path, options = {}) {

  const normalizedPath =
    path.startsWith('/')
      ? path
      : `/${path}`;

  const headers = {
    'Content-Type': 'application/json',

    ...(getToken()
      ? {
          Authorization:
          `Bearer ${getToken()}`
        }
      : {}),

    ...(options.headers || {})
  };

  try {

    const res = await fetch(
      `${BASE_URL}${normalizedPath}`,
      {
        ...options,
        headers
      }
    );

    const text = await res.text();

    let data = {};

    try {

      data = text
        ? JSON.parse(text)
        : {};

    } catch {

      data = {
        message: text
      };
    }

    console.log(
      "API RESPONSE:",
      data
    );

    if (!res.ok) {

      console.log("FULL ERROR:", data);

throw new Error(
  JSON.stringify(data, null, 2)
);
    }

    return data;

  } catch(err) {

    console.error(
      "FETCH ERROR:",
      err
    );

    throw new Error(
      err.message ||
      'Failed to fetch'
    );
  }
}

// ── Mock Data ────────────────────────────────────────────────


// ── Auth API ─────────────────────────────────────────────────

const AuthAPI = {

  async login(email, password) {

  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    })
  });

  console.log("LOGIN RESPONSE:", data);

  const token =
    data.access_token ||
    data.token;

  if (!token) {
    throw new Error("Login failed");
  }

  setToken(token);

  return {
  token,
  user: {
    name: data.name || "User",
    email: email,
    avatar: "U",
    plan: "Free Plan",
    education: "",
    goals: ""
  }
};
},

   async register(name, email, password) {

    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const token =
      data.token ||
      data.access_token ||
      data.accessToken;

    if (token) {
      setToken(token);
    }

    return {
  token,
  user: {
    name: name || "User",
    email: email,
    avatar: "U",
    plan: "Free Plan",
    education: "",
    goals: ""
  }
};
  },

  logout() {
    removeToken();
  }
};

// ── User API ─────────────────────────────────────────────────

const UserAPI = {

  async getProfile() {
    return await request('/user/dashboard');
  },

  async updateProfile(data) {

    return await request('/user/dashboard', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// ── Career API ───────────────────────────────────────────────

const CareerAPI = {

  async getRecommendations(inputData) {

    return await request('/api/predict', {
      method: 'POST',
      body: JSON.stringify(inputData)
    });

  },

  async getRoadmap(role) {

    return await request('/api/roadmap', {
      method: 'POST',

      body: JSON.stringify({
        role: role
      })
    });

  },

  async getHistory() {

    return await request('/api/history');

  },

  async getDetail(id) {

    return await request(`/careers/${id}`);

  }

};

// ── Feedback API ─────────────────────────────────────────────

const FeedbackAPI = {

  async submit(data) {

    return await request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ── Global ───────────────────────────────────────────────────

window.API = {
  Auth: AuthAPI,
  User: UserAPI,
  Career: CareerAPI,
  Feedback: FeedbackAPI
};

