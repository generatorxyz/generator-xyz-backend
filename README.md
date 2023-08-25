# Generator XYZ - NodeJS Backend

![](https://res.cloudinary.com/raymons/video/upload/q_70,f_webp,w_800/v1676561033/generator-xyz/onboarding/generator-xyz-screen-recording-no-audio.mov)

This is the backend application of [GeneratorXYZ](https://generatorxyz.com) which is a platform for generating content with AI. Like social media messages, summaries and SEO improvers.

> **Why make it opensource?**
> I decided to make the frontend application opensource so more people can use it to build their own platform. You can clone this repo and use it how you like. Using the GeneratorXYZ logo is not allowed, so give yours a different name. Mentioning you use this software will be appriciated, but is not required 🫶.

---

## What do you need to run this app?

- [Generator XYZ frontend](https://github.com/generatorxyz/generatorxyz-app), the live version is [generatorxyz.com](https://generatorxyz.com)
- [OpenAI](https://platform.openai.com/overview) account
- [Supabase](https://supabase.com/) account
- Email provider (I use [Mailgun](https://www.mailgun.com/), but thanks to `nodemailer` you can pick another one)
- [Stripe](https://stripe.com) account

---

## Before you start

1. Make sure you have an account for all the services
2. Open the `sample.env` file and save it as `.env`
3. Fill at least the required properties in your `.env` file. (If you already created your Supabase project, you can check **Settings > API**).
4. Now you can run it.

> I do not have added Swagger, but if you like you can add it so others can use it as well 👍

---

## Where does it run?

You can use any hosting provider which provide NodeJS hosting. But I use [Render.com](https://render.com) because this repo will just work. 

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start
```


