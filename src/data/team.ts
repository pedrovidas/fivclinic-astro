export interface Person {
  name: string;
  photo: string;
  roles: string[];
  spec: string[];
  social: { linkedin?: string; x?: string; doctoralia?: string };
}
export interface Dept { name: string; people: Person[]; }

export const medicalTeam: Dept[] = [
  { name: "GYNECOLOGY", people: [
    {
      name: "DOLORS MANAU",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Dolors-Manau.jpg",
      roles: ["Head of the Assisted Reproduction Unit of the del Barcelona Clinic", "Associate Professor of the Universitat de Barcelona", "Associate Researcher of IDIBAPS"],
      spec: ["Assisted Reproduction", "Genetics and Reproduction", "Fertility preservation", "Ginecology : endometriosis , lifestyle and reproductive health"],
      social: {"linkedin": "https://www.linkedin.com/in/dolors-manau-55028a221"},
    },
    {
      name: "INÉS AGUSTÍ",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Ines-Agusti.jpg",
      roles: ["Specialist gynecologist at the Assisted Reproduction Unit of the Hospital Clínic de Barcelona"],
      spec: ["Gynecology and Obstetrics", "Assisted Reproduction", "Low response and IVF in unstimulated natural cycle"],
      social: {"linkedin": "https://www.linkedin.com/in/in%C3%A9s-agust%C3%AD-58ab36239/"},
    },
    {
      name: "YASMINA BARRAL",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Yasmina-Barral.jpg",
      roles: ["Specialist gynecologist at the Assisted Reproduction Unit of the Hospital Clínic de Barcelona"],
      spec: ["Gynecology and Obstetrics", "Assisted Reproduction", "Fertility preservation"],
      social: {"linkedin": "https://www.linkedin.com/in/yasmina-barral-el-gaoui-38457755/?originalSubdomain=es"},
    },
    {
      name: "LAURA RIBERA",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Laura-Ribera.jpg",
      roles: ["Gynecologist specialist at fivclínic+"],
      spec: ["Gynecology and Obstetrics", "Assisted Reproduction", "Sexology"],
      social: {"linkedin": "https://www.linkedin.com/in/laura-ribera-torres-88b71b277/"},
    },
    {
      name: "FRANCISCO CARMONA",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Francisco-Carmona.jpg",
      roles: ["Senior medical consultant in ginecology at Clínic de Barcelona", "Proffesor at the Universitat de Barcelona", "Associate researcher at IDIBAPS"],
      spec: ["Endometriosis"],
      social: {"linkedin": "https://www.linkedin.com/in/meritxell-munmany-delgado-431a1997/?originalSubdomain=es"},
    },
    {
      name: "MERITXELL MUNMANY",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Meritxell-Munmany.jpg",
      roles: ["Senior specialist in the Gynecology and Obstetrics Service of the Clínic de Barcelona"],
      spec: ["Hysteroscopy"],
      social: {"linkedin": "https://www.linkedin.com/in/meritxell-munmany-delgado-431a1997/?originalSubdomain=es"},
    },
  ] },
  { name: "GENETICS", people: [
    {
      name: "AURORA SÁNCHEZ",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Aurora-Sanchez.jpg",
      roles: ["Geneticist at the Assisted Reproduction Unit of Clínic de Barcelona"],
      spec: ["Clinical Genetics and Cytogenetics"],
      social: {"linkedin": "https://www.linkedin.com/in/bel%C3%A9n-garc%C3%ADa-43029912b/"},
    },
    {
      name: "BELÉN GARCÍA",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Belen-Garcia.jpeg",
      roles: ["Genetic Counselor at the Assisted Reproduction Unit of Clínic de Barcelona"],
      spec: ["Clinical Genetics and Cytogenetics"],
      social: {"linkedin": "https://www.linkedin.com/in/bel%C3%A9n-garc%C3%ADa-43029912b/"},
    },
  ] },
  { name: "HEMATOLOGY", people: [
    {
      name: "JUAN CARLOS REVERTER",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Juan-Carlos-Reverter.jpg",
      roles: ["Head of the Hemotherapy and Hemostasis Service of the Clínic de Barcelona", "Associate researcher at IDIBAPS"],
      spec: ["Hematological alterations in pregnancy", "Hemophilia", "Coagulation disorders"],
      social: {"linkedin": "https://www.linkedin.com/in/narcis-masoller-casas-33b44b47/", "x": "https://x.com/juanmacorr"},
    },
  ] },
  { name: "ANDROLOGY", people: [
    {
      name: "JUAN MANUEL CORRAL",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Juan-Manuel-Corral.jpg",
      roles: ["Urologist and Andrologist at the Clínic de Barcelona", "Associate Professor at the Universitat de Barcelona", "Associate researcher at IDIBAPS"],
      spec: ["Andrology and reproductive medicine with the involvement of the male factor", "Reproductive andrology", "Reproductive surgery", "Vas-vasostomy"],
      social: {"linkedin": "https://www.linkedin.com/in/juan-manuel-corral-molina-8a154160/?originalSubdomain=es", "x": "https://x.com/juanmacorr"},
    },
  ] },
  { name: "OBSTETRICS AND MATERNOFETAL MEDICINE", people: [
    {
      name: "NARCÍS MASOLLER",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Narcis-Masoller.jpg",
      roles: ["Specialist in the Maternal-Fetal Medicine Service of the Clínic de Barcelona", "Associate researcher at IDIBAPS"],
      spec: ["Expert in ultrasound control of pregnancy", "Echographic expert (echocardiography) + Pregestational advice", "Prenatal diagnosis"],
      social: {"linkedin": "https://www.linkedin.com/in/narcis-masoller-casas-33b44b47/"},
    },
  ] },
  { name: "NUTRITION", people: [
    {
      name: "ALBA ANDREU",
      photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Alba-andreu.jpg",
      roles: ["Dietitian-Nutritionist of the Assisted Reproduction Unit of the Clínic de Barcelona", "Dietitian-Nutritionist of the Endocrinology service of the Clínic de Barcelona", "Associate researcher at IDIBAPS"],
      spec: ["Nutritional support in Assisted Reproduction"],
      social: {"linkedin": "https://www.linkedin.com/in/alba-andreu-dietista-6a371a31/", "x": "https://x.com/AlbaAndreuDN"},
    },
  ] },
];

export const nursingTeam = [
  { name: "NatÀlia Charines", photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Natalia-Charines.jpg", role: "TCAI (Nursing Auxiliary Care Technician)" },
  { name: "Maria Martorell", photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Maria-Martorell.jpg", role: "TCAI (Nursing Auxiliary Care Technician)" },
];

export const adminTeam = [
  { name: "Sonia Monge", photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Sonia-Monge.jpg", role: "Administrative" },
  { name: "Bassma Bakkouh", photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/Basma-Bakkouh.jpg", role: "Administrative" },
  { name: "Paula Montoya", photo: "https://fivclinic.es/international-patients/wp-content/uploads/2026/04/administrativa.jpg", role: "Administrative" },
];
