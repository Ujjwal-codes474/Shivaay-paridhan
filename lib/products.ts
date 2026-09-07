export type Product={
  id:string; slug:string; name:string; price:number; oldPrice?:number; category:string;
  fabric:string; color:string; occasion:string; description:string; image?:string;
  rating:number; stock:number; featured?:boolean;
};

export const products:Product[]=[
 {id:'p1',slug:'royal-banarasi-silk',name:'Royal Banarasi Silk Saree',price:2999,oldPrice:3999,category:'Sarees',fabric:'Banarasi Silk',color:'Maroon',occasion:'Wedding',description:'A refined Banarasi silk saree with traditional zari-inspired detailing, designed for weddings and grand celebrations.',image:'/shivaay/image-20.png',rating:4.9,stock:12,featured:true},
 {id:'p2',slug:'heritage-kanjivaram',name:'Heritage Kanjivaram Saree',price:3499,oldPrice:4499,category:'Sarees',fabric:'Kanjivaram Silk',color:'Navy',occasion:'Festive',description:'A rich silk silhouette inspired by South Indian heritage, finished with an elegant border.',image:'/shivaay/image-16.png',rating:4.8,stock:8,featured:true},
 {id:'p3',slug:'crimson-zari-saree',name:'Crimson Zari Saree',price:2499,oldPrice:3299,category:'Sarees',fabric:'Silk',color:'Crimson',occasion:'Wedding',description:'A statement crimson drape with a graceful zari border for wedding ceremonies and receptions.',image:'/shivaay/image-19.png',rating:4.8,stock:10,featured:true},
 {id:'p4',slug:'rose-heritage-saree',name:'Rose Heritage Saree',price:2299,oldPrice:2999,category:'Sarees',fabric:'Cotton Silk',color:'Rose',occasion:'Casual',description:'Soft rose tones and a comfortable drape for refined everyday styling.',image:'/shivaay/image-12.png',rating:4.7,stock:18,featured:true},
 {id:'p5',slug:'ivory-elegance-saree',name:'Ivory Elegance Saree',price:1999,oldPrice:2499,category:'Sarees',fabric:'Chiffon',color:'Ivory',occasion:'Formal',description:'An elegant ivory silhouette with delicate detailing for formal occasions.',image:'/shivaay/image-14.png',rating:4.7,stock:14},
 {id:'p6',slug:'midnight-party-drape',name:'Midnight Party Drape',price:2799,oldPrice:3499,category:'Sarees',fabric:'Satin Silk',color:'Navy',occasion:'Party Wear',description:'A sleek evening drape with a modern finish and understated shimmer.',image:'/shivaay/image-15.png',rating:4.8,stock:9},
 {id:'p7',slug:'blush-wedding-edit',name:'Blush Wedding Edit',price:3199,oldPrice:4199,category:'Sarees',fabric:'Georgette',color:'Blush',occasion:'Wedding',description:'Romantic blush styling for wedding festivities, receptions and celebrations.',image:'/shivaay/image-17.png',rating:4.9,stock:6},
 {id:'p8',slug:'ivory-everyday-weave',name:'Ivory Everyday Weave',price:1599,oldPrice:1999,category:'Sarees',fabric:'Cotton',color:'Ivory',occasion:'Casual',description:'A breathable neutral weave designed for simple, graceful daily styling.',image:'/shivaay/image-05.png',rating:4.5,stock:25},
 {id:'p9',slug:'royal-maroon-evening',name:'Royal Maroon Evening Saree',price:2899,oldPrice:3699,category:'Sarees',fabric:'Silk Blend',color:'Maroon',occasion:'Party Wear',description:'Deep maroon tones with a polished finish for evening occasions.',image:'/shivaay/image-04.png',rating:4.7,stock:11},
 {id:'p10',slug:'handloom-green-classic',name:'Handloom Green Classic',price:2699,oldPrice:3299,category:'Sarees',fabric:'Handloom',color:'Emerald',occasion:'Festive',description:'A heritage-inspired green handloom look with a rich traditional border.',image:'/shivaay/image-10.png',rating:4.8,stock:7},
 {id:'p11',slug:'pink-garden-weave',name:'Pink Garden Weave',price:2199,oldPrice:2799,category:'Sarees',fabric:'Cotton',color:'Pink',occasion:'Casual',description:'A graceful pink weave inspired by garden evenings and relaxed celebrations.',image:'/shivaay/image-02.png',rating:4.6,stock:16},
 {id:'p12',slug:'royal-blue-formal',name:'Royal Blue Formal Saree',price:2399,oldPrice:2999,category:'Sarees',fabric:'Silk Blend',color:'Royal Blue',occasion:'Formal',description:'A polished blue drape designed for elegant dinners, ceremonies and formal events.',image:'/shivaay/image-03.png',rating:4.7,stock:13},
];

export const fabrics=['Silk','Cotton','Kanjivaram','Chiffon','Organza','Georget'];
export const categories=['Wedding','Cotton','Silk','Handloom','Kota','Jewellery'];

export function getProduct(slug:string){return products.find(p=>p.slug===slug)}
