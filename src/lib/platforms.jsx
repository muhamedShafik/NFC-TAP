export const PLATFORMS = {
  google: {
    key: 'google',
    name: 'Google Review',
    sub: 'Rate us on Google',
    color: '#4285F4',
    gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
    placeholder: 'https://search.google.com/local/writereview?placeid=...',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    sub: 'Follow & tag us',
    color: '#d6249f',
    gradient: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    placeholder: 'https://instagram.com/yourshop',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497"/>
            <stop offset="5%" stopColor="#fdf497"/>
            <stop offset="45%" stopColor="#fd5949"/>
            <stop offset="60%" stopColor="#d6249f"/>
            <stop offset="90%" stopColor="#285AEB"/>
          </radialGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)"/>
        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1" fill="white"/>
      </svg>
    ),
  },
  facebook: {
    key: 'facebook',
    name: 'Facebook',
    sub: 'Leave a Facebook review',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #1877F2 0%, #0a5fc8 100%)',
    placeholder: 'https://facebook.com/yourpage/reviews',
    icon: (
      <svg viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  whatsapp: {
    key: 'whatsapp',
    name: 'WhatsApp',
    sub: 'Chat with us',
    color: '#25D366',
    gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    placeholder: 'https://wa.me/911234567890',
    icon: (
      <svg viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  tripadvisor: {
    key: 'tripadvisor',
    name: 'TripAdvisor',
    sub: 'Review on TripAdvisor',
    color: '#00aa6c',
    gradient: 'linear-gradient(135deg, #00aa6c 0%, #007a4d 100%)',
    placeholder: 'https://tripadvisor.com/Restaurant_Review-...',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#00aa6c"/>
        <text x="12" y="16" fontFamily="Arial" fontSize="11" fontWeight="bold" textAnchor="middle" fill="white">TA</text>
      </svg>
    ),
  },
  zomato: {
    key: 'zomato',
    name: 'Zomato',
    sub: 'Rate us on Zomato',
    color: '#E23744',
    gradient: 'linear-gradient(135deg, #E23744 0%, #c0202d 100%)',
    placeholder: 'https://zomato.com/your-restaurant',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#E23744"/>
        <text x="12" y="16.5" fontFamily="Arial" fontSize="11" fontWeight="bold" textAnchor="middle" fill="white">Z</text>
      </svg>
    ),
  },
  custom: {
    key: 'custom',
    name: 'Custom Link',
    sub: 'Visit our website',
    color: '#6c63ff',
    gradient: 'linear-gradient(135deg, #6c63ff 0%, #4c46cc 100%)',
    placeholder: 'https://yourwebsite.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
}

export const PLATFORM_KEYS = Object.keys(PLATFORMS)
export const SWATCHES = ['#6c63ff','#e91e8c','#00b4d8','#f59e0b','#22c55e','#ef4444','#ff6b35','#7c3aed','#06b6d4','#ec4899']
