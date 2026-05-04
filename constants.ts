export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  link: string;
  video?: string;
}

export const projects: Project[] = [
  {
    id: "01",
    title: "THRISULAM",
    description: "This project explores the sacred symbolism of the Trisulam, the divine weapon associated with Durga. Designed as a premium 3D product visualization, shifting between spiritual depth and aesthetic minimalism.",
    category: "3D ANIMATION / BLENDER",
    image: "https://picsur.org/i/a2786fdd-73f5-4c43-ba7b-cfb6a0d035fd.jpg",
    link: "https://www.behance.net/gallery/247117231/Trisulam-A-blender-3d-animation"
  },
  {
    id: "02",
    title: "THE BATPHONE",
    description: "A cinematic 3D visualization inspired by the dark, high-tech aesthetic of Batman's universe. This project focuses on hyper-realistic modeling, texturing, and lighting, showcasing a futuristic gadget in a film-quality presentation.",
    category: "PRODUCT SHOWCASE / 3D",
    image: "https://picsur.org/i/ae89fcaf-4c9f-4b79-99ea-1fe0c2ecb431.jpg",
    link: "https://www.behance.net/gallery/222172917/The-Batphone"
  },
  {
    id: "03",
    title: "THE ROOM",
    description: "An immersive 3D environment created in Blender that explores the boundary between digital gaming and reality. A glimpse into a world where game assets come to life.",
    category: "ENVIRONMENT ART / BLENDER",
    image: "https://picsur.org/i/2fdf7f41-5a6d-4fe4-87de-9f64a2ebc898.jpg",
    link: "https://www.behance.net/gallery/207303421/The-Room-3D-Project"
  },
  {
    id: "04",
    title: "RAJINIFIED",
    description: "A reimagining of the 'Coolie' movie intro with the epic structural animation style of Game of Thrones. A stylized Blender animation celebrating Indian cinema through a cinematic lens.",
    category: "MOTION DESIGN / ANIMATION",
    image: "https://picsur.org/i/bedf2459-ddf2-4305-9b14-d79f39de55fe.jpg",
    link: "https://www.behance.net/gallery/240289999/Coolie-Intro-A-Blender-animation-Rajinikanth"
  }
];
