import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { readLanguage } from './language'

const resources = {
    en: {
    translation: {
        title: 'Driver sign in',
        email: 'Email',
        password: 'Password',
        signIn: 'Sign in',
        signedIn: 'Signed in',
        shellTitle: 'EcoCollect Driver',
        inboxTitle: 'Notices',
        inboxEmpty: 'No published notices',
        inboxError: 'Could not load notices',
      },
},
si: {
    translation: {
        title: 'රියදුරු පිවිසුම',
        email: 'විද්‍යුත් තැපෑල',
        password: 'මුරපදය',
        signIn: 'පිවිසෙන්න',
        signedIn: 'පිවිස ඇත',
        shellTitle: 'ඉකොකලෙක්ට් රියදුරු',
        inboxTitle: 'නිවේදන',
        inboxEmpty: 'ප්‍රකාශිත නිවේදන නැත',
        inboxError: 'නිවේදන පූරණය කළ නොහැක',
      },
},
ta: {
    translation: {
      title: 'ஓட்டுநர் உள்நுழைவு',
      email: 'மின்னஞ்சல்',
      password: 'கடவுச்சொல்',
      signIn: 'உள்நுழை',
      signedIn: 'உள்நுழைந்தது',
      shellTitle: 'எக்கோகலெக்ட் ஓட்டுநர்',
      inboxTitle: 'அறிவிப்புகள்',
      inboxEmpty: 'வெளியிடப்பட்ட அறிவிப்புகள் இல்லை',
      inboxError: 'அறிவிப்புகளை ஏற்ற முடியவில்லை',
    },
},
}

void i18n.use(initReactI18next).init({
    resources,
    lng: readLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false},
})

export default i18n