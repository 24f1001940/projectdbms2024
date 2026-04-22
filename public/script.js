// script.js — small utilities
function q(sel){ return document.querySelector(sel); }
function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }
function formatRs(v){ return '₹' + Number(v||0).toFixed(2); }
function loadCanteenCart(){ try { return JSON.parse(localStorage.getItem('canteen_cart')||'[]'); } catch(e){ return []; } }
function saveCanteenCart(items){ localStorage.setItem('canteen_cart', JSON.stringify(items)); }
