const express = require('express');
const { generateApiKey } = require('generate-api-key');
const app = express();
const PORT = 3000;
require('dotenv').config();

//Variables

// Stripe key
const STRIPE_SECRET_KEY = process.env.STRIPE_SK;
// Stripe secret key
const stripe = require('stripe')(STRIPE_SECRET_KEY);
// domain
const DOMAIN = 'http://localhost:3000'
// middleware
app.use(express.static('public'))

//routes

// session checkout route based off product
app.post('/create-checkout-session/:product', async (req, res) => {
    // product
    const {product} = req.params;
    // interface
    let mode, price_ID, line_items;

// if product is a subscription type, show the priceID of the subscription page (we created it in stripe)
    if (product === 'sub') {
        // priceID
        price_ID = 'price_1O1qcMJ8tWyUVEW7JsoL3ntJ'
        // payment type
        mode = 'subscription'
        // price
        line_items = [
            {
                price: price_ID,
            }
        ]
    // if product is a one-time payment, show the priceID of the one-time page (we created it in stripe)
    } else if (product === 'pre') {
        price_ID = 'price_1O1qb6J8tWyUVEW79lHwS5BT'
        mode = 'payment'
        line_items = [
            {
                price: price_ID,
                quantity: 1
            }
        ]
    // else show error
    } else {
        return res.sendStatus(403)
    }
    // generate API key if they get through
    const newAPIKey = generateApiKey();

    // create customer
    const customer = await stripe.customers.create({
        metadata: {
            APIkey: newAPIKey
        }
    })
    // get customer ID
    const stripeCustomerId = customer.id;
    // create checkout session with customer ID that either takes the user to success of cancel URL page
    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        metadata: {
            APIkey: newAPIKey,
            payment_type: product
        },
        line_items: line_items,
        mode: mode,
        success_url: `${DOMAIN}/success.html?api_key=${newAPIKey}`,
        cancel_url: `${DOMAIN}/cancel.html`
    })

    // create firebase record

    // use webhook to access firebase & ensure that billing is updated. 
    res.redirect(303, session.url)
})

app.listen(PORT, () => {
    `You are connected to port ${PORT}`
})