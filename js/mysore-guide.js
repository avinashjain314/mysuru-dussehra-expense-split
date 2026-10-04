/**
 * Mysuru Dasara 2026 - Trip Companion & Itinerary Guide
 * Curated insider guide for Avinash & Thannmay's Dussehra trip on 17 October 2026.
 */

const MYSORE_GUIDE_DATA = {
  palace: {
    title: 'Mysore Palace Illumination',
    timing: '7:00 PM - 8:00 PM',
    highlight: 'Over 97,000 incandescent bulbs light up together to celebrate Dasara!',
    tips: 'Reach South Gate or Doddakere ground by 6:30 PM for unobstructed photos. Entry tickets ₹100.'
  },
  foodTrail: [
    {
      name: 'Hotel Vinayaka Mylari',
      location: 'Nazarbad Main Rd',
      specialty: 'Original Butter Masala Dosa & Sagu',
      desc: 'Super soft, melt-in-mouth dosa with special butter topping served on banana leaf.'
    },
    {
      name: 'Guru Sweets Mart',
      location: 'Sayyaji Rao Road',
      specialty: 'Authentic Ghee Mysore Pak',
      desc: 'The original sweet stall run by descendants of royal chef Kakasura Madappa who invented Mysore Pak!'
    },
    {
      name: 'RRR Restaurant',
      location: 'Gandhi Square',
      specialty: 'Mysuru Style Biryani & Chilli Chicken',
      desc: 'Flavorful spiced biryani served piping hot on fresh plantain leaf.'
    },
    {
      name: 'Gayatri Tiffin Room (GTR)',
      location: 'Chamundipuram',
      specialty: 'Crispy Benne Dosa & Filter Coffee',
      desc: 'Beloved heritage tiffin room famous for Badam Halwa, Khara Bath and pure filter coffee.'
    }
  ],
  sightseeing: [
    {
      spot: 'Chamundi Hills & Sri Chamundeshwari Temple',
      timing: '6:00 AM - 9:00 PM',
      desc: 'Sacred hill overlooking the royal city with the giant Mahishasura statue and Nandi monolith.'
    },
    {
      spot: 'Dasara Exhibition (Doddakere Maidan)',
      timing: '3:30 PM - 9:30 PM',
      desc: 'Vibrant festival carnival with giant wheels, food stalls, games, and Karnataka artisans.'
    },
    {
      spot: 'Dasara Flower Show (Nishad Bagh / Kuppanna Park)',
      timing: '9:00 AM - 8:30 PM',
      desc: 'World-class botanical sculpture displays made with lakhs of fresh flowers.'
    },
    {
      spot: 'Brindavan Gardens & KRS Dam',
      timing: 'Musical Fountain: 6:30 PM - 7:30 PM',
      desc: 'Terraced Mughal-style garden with illuminated dancing fountains.'
    }
  ],
  travelTips: [
    {
      title: 'Bengaluru-Mysuru Expressway (NH 275)',
      desc: 'Smooth ~1.5 - 2 hour drive from Kengeri / NICE road exit. Ensure Fastag balance is topped up (~₹320).'
    },
    {
      title: 'Iconic Breakfast Pitstop',
      desc: 'Stop at Bidadi Thatte Idli or Maddur Tiffany’s for hot crispy Maddur Vada & filter coffee on your way!'
    }
  ]
};

window.MysoreGuideData = MYSORE_GUIDE_DATA;
