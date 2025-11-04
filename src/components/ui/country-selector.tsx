"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Country {
  code: string;
  name: string;
  dial_code: string;
  format?: string; // Formato do telefone, ex: "(XX) XXXXX-XXXX"
  maxLength?: number; // Número máximo de dígitos
}

// Função para formatar telefone baseado no país
export const formatPhoneByCountry = (value: string, country: Country): string => {
  const numbers = value.replace(/\D/g, "");
  const format = country.format || "XXX XXX XXXX";
  
  let formatted = "";
  let numberIndex = 0;
  
  for (let i = 0; i < format.length && numberIndex < numbers.length; i++) {
    if (format[i] === "X") {
      formatted += numbers[numberIndex];
      numberIndex++;
    } else {
      formatted += format[i];
    }
  }
  
  return formatted;
};

const allCountries: Country[] = [
  { code: "AF", name: "Afeganistão", dial_code: "+93", format: "XX XXX XXXX", maxLength: 9 },
  { code: "ZA", name: "África do Sul", dial_code: "+27", format: "XX XXX XXXX", maxLength: 9 },
  { code: "AL", name: "Albânia", dial_code: "+355", format: "XX XXX XXXX", maxLength: 9 },
  { code: "DE", name: "Alemanha", dial_code: "+49", format: "XXX XXXXXXX", maxLength: 10 },
  { code: "AD", name: "Andorra", dial_code: "+376", format: "XXX XXX", maxLength: 6 },
  { code: "AO", name: "Angola", dial_code: "+244", format: "XXX XXX XXX", maxLength: 9 },
  { code: "AI", name: "Anguilla", dial_code: "+1264", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "AG", name: "Antígua e Barbuda", dial_code: "+1268", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "SA", name: "Arábia Saudita", dial_code: "+966", format: "XX XXX XXXX", maxLength: 9 },
  { code: "DZ", name: "Argélia", dial_code: "+213", format: "XXX XX XX XX", maxLength: 9 },
  { code: "AR", name: "Argentina", dial_code: "+54", format: "(XX) XXXX-XXXX", maxLength: 10 },
  { code: "AM", name: "Armênia", dial_code: "+374", format: "XX XXX XXX", maxLength: 8 },
  { code: "AW", name: "Aruba", dial_code: "+297", format: "XXX XXXX", maxLength: 7 },
  { code: "AU", name: "Austrália", dial_code: "+61", format: "XXX XXX XXX", maxLength: 9 },
  { code: "AT", name: "Áustria", dial_code: "+43", format: "XXX XXXXXXX", maxLength: 10 },
  { code: "AZ", name: "Azerbaijão", dial_code: "+994", format: "XX XXX XX XX", maxLength: 9 },
  { code: "BS", name: "Bahamas", dial_code: "+1242", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "BH", name: "Bahrein", dial_code: "+973", format: "XXXX XXXX", maxLength: 8 },
  { code: "BD", name: "Bangladesh", dial_code: "+880", format: "XXXX XXXXXX", maxLength: 10 },
  { code: "BB", name: "Barbados", dial_code: "+1246", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "BY", name: "Belarus", dial_code: "+375", format: "XX XXX-XX-XX", maxLength: 9 },
  { code: "BE", name: "Bélgica", dial_code: "+32", format: "XXX XX XX XX", maxLength: 9 },
  { code: "BZ", name: "Belize", dial_code: "+501", format: "XXX XXXX", maxLength: 7 },
  { code: "BJ", name: "Benin", dial_code: "+229", format: "XX XX XXXX", maxLength: 8 },
  { code: "BM", name: "Bermudas", dial_code: "+1441", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "BO", name: "Bolívia", dial_code: "+591", format: "X XXX XXXX", maxLength: 8 },
  { code: "BA", name: "Bósnia e Herzegovina", dial_code: "+387", format: "XX XXX XXX", maxLength: 8 },
  { code: "BW", name: "Botsuana", dial_code: "+267", format: "XX XXX XXX", maxLength: 8 },
  { code: "BR", name: "Brasil", dial_code: "+55", format: "(XX) XXXXX-XXXX", maxLength: 11 },
  { code: "BN", name: "Brunei", dial_code: "+673", format: "XXX XXXX", maxLength: 7 },
  { code: "BG", name: "Bulgária", dial_code: "+359", format: "XX XXX XXXX", maxLength: 9 },
  { code: "BF", name: "Burkina Faso", dial_code: "+226", format: "XX XX XXXX", maxLength: 8 },
  { code: "BI", name: "Burundi", dial_code: "+257", format: "XX XX XXXX", maxLength: 8 },
  { code: "BT", name: "Butão", dial_code: "+975", format: "XX XXX XXX", maxLength: 8 },
  { code: "CV", name: "Cabo Verde", dial_code: "+238", format: "XXX XXXX", maxLength: 7 },
  { code: "CM", name: "Camarões", dial_code: "+237", format: "XXXX XXXX", maxLength: 8 },
  { code: "KH", name: "Camboja", dial_code: "+855", format: "XX XXX XXX", maxLength: 8 },
  { code: "CA", name: "Canadá", dial_code: "+1", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "KZ", name: "Cazaquistão", dial_code: "+7", format: "XXX XXX-XX-XX", maxLength: 10 },
  { code: "TD", name: "Chade", dial_code: "+235", format: "XX XX XX XX", maxLength: 8 },
  { code: "CL", name: "Chile", dial_code: "+56", format: "X XXXX XXXX", maxLength: 9 },
  { code: "CN", name: "China", dial_code: "+86", format: "XXX XXXX XXXX", maxLength: 11 },
  { code: "CY", name: "Chipre", dial_code: "+357", format: "XX XXX XXX", maxLength: 8 },
  { code: "CO", name: "Colômbia", dial_code: "+57", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "KM", name: "Comores", dial_code: "+269", format: "XXX XXXX", maxLength: 7 },
  { code: "CG", name: "Congo", dial_code: "+242", format: "XX XXX XXXX", maxLength: 9 },
  { code: "CD", name: "Congo (RDC)", dial_code: "+243", format: "XXX XXX XXX", maxLength: 9 },
  { code: "KP", name: "Coreia do Norte", dial_code: "+850", format: "XXX XXXX XXX", maxLength: 10 },
  { code: "KR", name: "Coreia do Sul", dial_code: "+82", format: "XX XXXX XXXX", maxLength: 10 },
  { code: "CI", name: "Costa do Marfim", dial_code: "+225", format: "XX XX XX XX", maxLength: 8 },
  { code: "CR", name: "Costa Rica", dial_code: "+506", format: "XXXX XXXX", maxLength: 8 },
  { code: "HR", name: "Croácia", dial_code: "+385", format: "XX XXX XXXX", maxLength: 9 },
  { code: "CU", name: "Cuba", dial_code: "+53", format: "X XXX XXXX", maxLength: 8 },
  { code: "CW", name: "Curaçao", dial_code: "+599", format: "XXX XXXX", maxLength: 7 },
  { code: "DK", name: "Dinamarca", dial_code: "+45", format: "XX XX XX XX", maxLength: 8 },
  { code: "DJ", name: "Djibuti", dial_code: "+253", format: "XX XX XX XX", maxLength: 8 },
  { code: "DM", name: "Dominica", dial_code: "+1767", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "EG", name: "Egito", dial_code: "+20", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "SV", name: "El Salvador", dial_code: "+503", format: "XXXX XXXX", maxLength: 8 },
  { code: "AE", name: "Emirados Árabes Unidos", dial_code: "+971", format: "XX XXX XXXX", maxLength: 9 },
  { code: "EC", name: "Equador", dial_code: "+593", format: "XX XXX XXXX", maxLength: 9 },
  { code: "ER", name: "Eritreia", dial_code: "+291", format: "X XXX XXX", maxLength: 7 },
  { code: "SK", name: "Eslováquia", dial_code: "+421", format: "XXX XXX XXX", maxLength: 9 },
  { code: "SI", name: "Eslovênia", dial_code: "+386", format: "XX XXX XXX", maxLength: 8 },
  { code: "ES", name: "Espanha", dial_code: "+34", format: "XXX XXX XXX", maxLength: 9 },
  { code: "US", name: "Estados Unidos", dial_code: "+1", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "EE", name: "Estônia", dial_code: "+372", format: "XXXX XXXX", maxLength: 8 },
  { code: "SZ", name: "Esuatíni", dial_code: "+268", format: "XX XX XXXX", maxLength: 8 },
  { code: "ET", name: "Etiópia", dial_code: "+251", format: "XX XXX XXXX", maxLength: 9 },
  { code: "FJ", name: "Fiji", dial_code: "+679", format: "XXX XXXX", maxLength: 7 },
  { code: "PH", name: "Filipinas", dial_code: "+63", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "FI", name: "Finlândia", dial_code: "+358", format: "XX XXX XXXX", maxLength: 9 },
  { code: "FR", name: "França", dial_code: "+33", format: "X XX XX XX XX", maxLength: 9 },
  { code: "GA", name: "Gabão", dial_code: "+241", format: "X XX XX XX", maxLength: 7 },
  { code: "GM", name: "Gâmbia", dial_code: "+220", format: "XXX XXXX", maxLength: 7 },
  { code: "GH", name: "Gana", dial_code: "+233", format: "XX XXX XXXX", maxLength: 9 },
  { code: "GE", name: "Geórgia", dial_code: "+995", format: "XXX XXX XXX", maxLength: 9 },
  { code: "GI", name: "Gibraltar", dial_code: "+350", format: "XXXX XXXX", maxLength: 8 },
  { code: "GD", name: "Granada", dial_code: "+1473", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "GR", name: "Grécia", dial_code: "+30", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "GL", name: "Groenlândia", dial_code: "+299", format: "XX XX XX", maxLength: 6 },
  { code: "GP", name: "Guadalupe", dial_code: "+590", format: "XXX XX XX XX", maxLength: 9 },
  { code: "GU", name: "Guam", dial_code: "+1671", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "GT", name: "Guatemala", dial_code: "+502", format: "XXXX XXXX", maxLength: 8 },
  { code: "GG", name: "Guernsey", dial_code: "+44", format: "XXXX XXX XXX", maxLength: 10 },
  { code: "GY", name: "Guiana", dial_code: "+592", format: "XXX XXXX", maxLength: 7 },
  { code: "GF", name: "Guiana Francesa", dial_code: "+594", format: "XXX XX XX XX", maxLength: 9 },
  { code: "GN", name: "Guiné", dial_code: "+224", format: "XX XXX XXX", maxLength: 8 },
  { code: "GQ", name: "Guiné Equatorial", dial_code: "+240", format: "XXX XXX XXX", maxLength: 9 },
  { code: "GW", name: "Guiné-Bissau", dial_code: "+245", format: "XXX XXXX", maxLength: 7 },
  { code: "HT", name: "Haiti", dial_code: "+509", format: "XX XX XXXX", maxLength: 8 },
  { code: "HN", name: "Honduras", dial_code: "+504", format: "XXXX XXXX", maxLength: 8 },
  { code: "HK", name: "Hong Kong", dial_code: "+852", format: "XXXX XXXX", maxLength: 8 },
  { code: "HU", name: "Hungria", dial_code: "+36", format: "XX XXX XXXX", maxLength: 9 },
  { code: "YE", name: "Iêmen", dial_code: "+967", format: "XXX XXX XXX", maxLength: 9 },
  { code: "IM", name: "Ilha de Man", dial_code: "+44", format: "XXXX XXX XXX", maxLength: 10 },
  { code: "KY", name: "Ilhas Cayman", dial_code: "+1345", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "CK", name: "Ilhas Cook", dial_code: "+682", format: "XX XXX", maxLength: 5 },
  { code: "FO", name: "Ilhas Faroe", dial_code: "+298", format: "XXX XXX", maxLength: 6 },
  { code: "FK", name: "Ilhas Malvinas", dial_code: "+500", format: "XXXXX", maxLength: 5 },
  { code: "MP", name: "Ilhas Marianas do Norte", dial_code: "+1670", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "MH", name: "Ilhas Marshall", dial_code: "+692", format: "XXX XXXX", maxLength: 7 },
  { code: "SB", name: "Ilhas Salomão", dial_code: "+677", format: "XXX XXXX", maxLength: 7 },
  { code: "TC", name: "Ilhas Turks e Caicos", dial_code: "+1649", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "VG", name: "Ilhas Virgens Britânicas", dial_code: "+1284", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "VI", name: "Ilhas Virgens Americanas", dial_code: "+1340", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "IN", name: "Índia", dial_code: "+91", format: "XXXXX XXXXX", maxLength: 10 },
  { code: "ID", name: "Indonésia", dial_code: "+62", format: "XXX XXXX XXXX", maxLength: 11 },
  { code: "IQ", name: "Iraque", dial_code: "+964", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "IR", name: "Irã", dial_code: "+98", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "IE", name: "Irlanda", dial_code: "+353", format: "XX XXX XXXX", maxLength: 9 },
  { code: "IS", name: "Islândia", dial_code: "+354", format: "XXX XXXX", maxLength: 7 },
  { code: "IL", name: "Israel", dial_code: "+972", format: "XX XXX XXXX", maxLength: 9 },
  { code: "IT", name: "Itália", dial_code: "+39", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "JM", name: "Jamaica", dial_code: "+1876", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "JP", name: "Japão", dial_code: "+81", format: "XX XXXX XXXX", maxLength: 10 },
  { code: "JE", name: "Jersey", dial_code: "+44", format: "XXXX XXX XXX", maxLength: 10 },
  { code: "JO", name: "Jordânia", dial_code: "+962", format: "X XXXX XXXX", maxLength: 9 },
  { code: "KW", name: "Kuwait", dial_code: "+965", format: "XXXX XXXX", maxLength: 8 },
  { code: "LA", name: "Laos", dial_code: "+856", format: "XX XX XXX XXX", maxLength: 10 },
  { code: "LS", name: "Lesoto", dial_code: "+266", format: "XX XXX XXX", maxLength: 8 },
  { code: "LV", name: "Letônia", dial_code: "+371", format: "XX XXX XXX", maxLength: 8 },
  { code: "LB", name: "Líbano", dial_code: "+961", format: "XX XXX XXX", maxLength: 8 },
  { code: "LR", name: "Libéria", dial_code: "+231", format: "XX XXX XXXX", maxLength: 9 },
  { code: "LY", name: "Líbia", dial_code: "+218", format: "XX XXX XXXX", maxLength: 9 },
  { code: "LI", name: "Liechtenstein", dial_code: "+423", format: "XXX XXXX", maxLength: 7 },
  { code: "LT", name: "Lituânia", dial_code: "+370", format: "XXX XXXXX", maxLength: 8 },
  { code: "LU", name: "Luxemburgo", dial_code: "+352", format: "XXX XXX XXX", maxLength: 9 },
  { code: "MO", name: "Macau", dial_code: "+853", format: "XXXX XXXX", maxLength: 8 },
  { code: "MK", name: "Macedônia do Norte", dial_code: "+389", format: "XX XXX XXX", maxLength: 8 },
  { code: "MG", name: "Madagáscar", dial_code: "+261", format: "XX XX XXX XX", maxLength: 9 },
  { code: "MY", name: "Malásia", dial_code: "+60", format: "XX XXXX XXXX", maxLength: 10 },
  { code: "MW", name: "Malawi", dial_code: "+265", format: "XXX XX XX XX", maxLength: 9 },
  { code: "MV", name: "Maldivas", dial_code: "+960", format: "XXX XXXX", maxLength: 7 },
  { code: "ML", name: "Mali", dial_code: "+223", format: "XX XX XX XX", maxLength: 8 },
  { code: "MT", name: "Malta", dial_code: "+356", format: "XXXX XXXX", maxLength: 8 },
  { code: "MA", name: "Marrocos", dial_code: "+212", format: "XX XXX XXXX", maxLength: 9 },
  { code: "MQ", name: "Martinica", dial_code: "+596", format: "XXX XX XX XX", maxLength: 9 },
  { code: "MU", name: "Maurício", dial_code: "+230", format: "XXXX XXXX", maxLength: 8 },
  { code: "MR", name: "Mauritânia", dial_code: "+222", format: "XX XX XX XX", maxLength: 8 },
  { code: "YT", name: "Mayotte", dial_code: "+262", format: "XXX XX XX XX", maxLength: 9 },
  { code: "MX", name: "México", dial_code: "+52", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "MM", name: "Myanmar", dial_code: "+95", format: "XX XXX XXXX", maxLength: 9 },
  { code: "FM", name: "Micronésia", dial_code: "+691", format: "XXX XXXX", maxLength: 7 },
  { code: "MZ", name: "Moçambique", dial_code: "+258", format: "XX XXX XXXX", maxLength: 9 },
  { code: "MD", name: "Moldávia", dial_code: "+373", format: "XX XXX XXX", maxLength: 8 },
  { code: "MC", name: "Mônaco", dial_code: "+377", format: "XX XX XX XX", maxLength: 8 },
  { code: "MN", name: "Mongólia", dial_code: "+976", format: "XX XX XXXX", maxLength: 8 },
  { code: "ME", name: "Montenegro", dial_code: "+382", format: "XX XXX XXX", maxLength: 8 },
  { code: "MS", name: "Montserrat", dial_code: "+1664", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "NA", name: "Namíbia", dial_code: "+264", format: "XX XXX XXXX", maxLength: 9 },
  { code: "NR", name: "Nauru", dial_code: "+674", format: "XXX XXXX", maxLength: 7 },
  { code: "NP", name: "Nepal", dial_code: "+977", format: "XX XXXX XXXX", maxLength: 10 },
  { code: "NI", name: "Nicarágua", dial_code: "+505", format: "XXXX XXXX", maxLength: 8 },
  { code: "NE", name: "Níger", dial_code: "+227", format: "XX XX XX XX", maxLength: 8 },
  { code: "NG", name: "Nigéria", dial_code: "+234", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "NU", name: "Niue", dial_code: "+683", format: "XXXX", maxLength: 4 },
  { code: "NO", name: "Noruega", dial_code: "+47", format: "XXX XX XXX", maxLength: 8 },
  { code: "NC", name: "Nova Caledônia", dial_code: "+687", format: "XX XX XX", maxLength: 6 },
  { code: "NZ", name: "Nova Zelândia", dial_code: "+64", format: "XX XXX XXXX", maxLength: 9 },
  { code: "OM", name: "Omã", dial_code: "+968", format: "XXXX XXXX", maxLength: 8 },
  { code: "NL", name: "Países Baixos", dial_code: "+31", format: "XX XXX XXXX", maxLength: 9 },
  { code: "PW", name: "Palau", dial_code: "+680", format: "XXX XXXX", maxLength: 7 },
  { code: "PS", name: "Palestina", dial_code: "+970", format: "XXX XXX XXX", maxLength: 9 },
  { code: "PA", name: "Panamá", dial_code: "+507", format: "XXXX XXXX", maxLength: 8 },
  { code: "PG", name: "Papua-Nova Guiné", dial_code: "+675", format: "XXX XXXX", maxLength: 7 },
  { code: "PK", name: "Paquistão", dial_code: "+92", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "PY", name: "Paraguai", dial_code: "+595", format: "XXX XXX XXX", maxLength: 9 },
  { code: "PE", name: "Peru", dial_code: "+51", format: "XXX XXX XXX", maxLength: 9 },
  { code: "PF", name: "Polinésia Francesa", dial_code: "+689", format: "XX XX XX", maxLength: 6 },
  { code: "PL", name: "Polônia", dial_code: "+48", format: "XXX XXX XXX", maxLength: 9 },
  { code: "PT", name: "Portugal", dial_code: "+351", format: "XXX XXX XXX", maxLength: 9 },
  { code: "PR", name: "Porto Rico", dial_code: "+1", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "QA", name: "Qatar", dial_code: "+974", format: "XXXX XXXX", maxLength: 8 },
  { code: "KE", name: "Quênia", dial_code: "+254", format: "XXX XXX XXX", maxLength: 9 },
  { code: "KG", name: "Quirguistão", dial_code: "+996", format: "XXX XXX XXX", maxLength: 9 },
  { code: "KI", name: "Quiribati", dial_code: "+686", format: "XXXX XXXX", maxLength: 8 },
  { code: "GB", name: "Reino Unido", dial_code: "+44", format: "XXXX XXX XXX", maxLength: 10 },
  { code: "CF", name: "República Centro-Africana", dial_code: "+236", format: "XX XX XX XX", maxLength: 8 },
  { code: "DO", name: "República Dominicana", dial_code: "+1", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "CZ", name: "República Tcheca", dial_code: "+420", format: "XXX XXX XXX", maxLength: 9 },
  { code: "RE", name: "Reunião", dial_code: "+262", format: "XXX XX XX XX", maxLength: 9 },
  { code: "RO", name: "Romênia", dial_code: "+40", format: "XXX XXX XXX", maxLength: 9 },
  { code: "RW", name: "Ruanda", dial_code: "+250", format: "XXX XXX XXX", maxLength: 9 },
  { code: "RU", name: "Rússia", dial_code: "+7", format: "XXX XXX-XX-XX", maxLength: 10 },
  { code: "EH", name: "Saara Ocidental", dial_code: "+212", format: "XX XXX XXXX", maxLength: 9 },
  { code: "WS", name: "Samoa", dial_code: "+685", format: "XX XXXX", maxLength: 6 },
  { code: "AS", name: "Samoa Americana", dial_code: "+1684", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "SM", name: "San Marino", dial_code: "+378", format: "XXXX XXXXXX", maxLength: 10 },
  { code: "SH", name: "Santa Helena", dial_code: "+290", format: "XXXX", maxLength: 4 },
  { code: "LC", name: "Santa Lúcia", dial_code: "+1758", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "KN", name: "São Cristóvão e Névis", dial_code: "+1869", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "PM", name: "São Pedro e Miquelão", dial_code: "+508", format: "XX XX XX", maxLength: 6 },
  { code: "ST", name: "São Tomé e Príncipe", dial_code: "+239", format: "XXX XXXX", maxLength: 7 },
  { code: "VC", name: "São Vicente e Granadinas", dial_code: "+1784", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "SN", name: "Senegal", dial_code: "+221", format: "XX XXX XXXX", maxLength: 9 },
  { code: "SL", name: "Serra Leoa", dial_code: "+232", format: "XX XXX XXX", maxLength: 8 },
  { code: "RS", name: "Sérvia", dial_code: "+381", format: "XX XXX XXXX", maxLength: 9 },
  { code: "SC", name: "Seychelles", dial_code: "+248", format: "X XXX XXX", maxLength: 7 },
  { code: "SG", name: "Singapura", dial_code: "+65", format: "XXXX XXXX", maxLength: 8 },
  { code: "SX", name: "Sint Maarten", dial_code: "+1721", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "SY", name: "Síria", dial_code: "+963", format: "XXX XXX XXX", maxLength: 9 },
  { code: "SO", name: "Somália", dial_code: "+252", format: "XX XXX XXX", maxLength: 8 },
  { code: "LK", name: "Sri Lanka", dial_code: "+94", format: "XX XXX XXXX", maxLength: 9 },
  { code: "SD", name: "Sudão", dial_code: "+249", format: "XX XXX XXXX", maxLength: 9 },
  { code: "SS", name: "Sudão do Sul", dial_code: "+211", format: "XX XXX XXXX", maxLength: 9 },
  { code: "SE", name: "Suécia", dial_code: "+46", format: "XX XXX XXXX", maxLength: 9 },
  { code: "CH", name: "Suíça", dial_code: "+41", format: "XX XXX XX XX", maxLength: 9 },
  { code: "SR", name: "Suriname", dial_code: "+597", format: "XXX XXXX", maxLength: 7 },
  { code: "SJ", name: "Svalbard e Jan Mayen", dial_code: "+47", format: "XXX XX XXX", maxLength: 8 },
  { code: "TH", name: "Tailândia", dial_code: "+66", format: "XX XXX XXXX", maxLength: 9 },
  { code: "TW", name: "Taiwan", dial_code: "+886", format: "XXX XXX XXX", maxLength: 9 },
  { code: "TJ", name: "Tadjiquistão", dial_code: "+992", format: "XX XXX XXXX", maxLength: 9 },
  { code: "TZ", name: "Tanzânia", dial_code: "+255", format: "XXX XXX XXX", maxLength: 9 },
  { code: "IO", name: "Território Britânico do Oceano Índico", dial_code: "+246", format: "XXX XXXX", maxLength: 7 },
  { code: "TL", name: "Timor-Leste", dial_code: "+670", format: "XXX XXXX", maxLength: 7 },
  { code: "TG", name: "Togo", dial_code: "+228", format: "XX XX XX XX", maxLength: 8 },
  { code: "TK", name: "Toquelau", dial_code: "+690", format: "XXXX", maxLength: 4 },
  { code: "TO", name: "Tonga", dial_code: "+676", format: "XXXXX", maxLength: 5 },
  { code: "TT", name: "Trinidad e Tobago", dial_code: "+1868", format: "(XXX) XXX-XXXX", maxLength: 10 },
  { code: "TN", name: "Tunísia", dial_code: "+216", format: "XX XXX XXX", maxLength: 8 },
  { code: "TM", name: "Turcomenistão", dial_code: "+993", format: "XX XXXXXX", maxLength: 8 },
  { code: "TR", name: "Turquia", dial_code: "+90", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "TV", name: "Tuvalu", dial_code: "+688", format: "XXXXX", maxLength: 5 },
  { code: "UA", name: "Ucrânia", dial_code: "+380", format: "XX XXX XXXX", maxLength: 9 },
  { code: "UG", name: "Uganda", dial_code: "+256", format: "XXX XXX XXX", maxLength: 9 },
  { code: "UY", name: "Uruguai", dial_code: "+598", format: "X XXX XXXX", maxLength: 8 },
  { code: "UZ", name: "Uzbequistão", dial_code: "+998", format: "XX XXX XXXX", maxLength: 9 },
  { code: "VU", name: "Vanuatu", dial_code: "+678", format: "XXX XXXX", maxLength: 7 },
  { code: "VA", name: "Vaticano", dial_code: "+39", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "VE", name: "Venezuela", dial_code: "+58", format: "XXX XXX XXXX", maxLength: 10 },
  { code: "VN", name: "Vietnã", dial_code: "+84", format: "XX XXXX XXXX", maxLength: 10 },
  { code: "WF", name: "Wallis e Futuna", dial_code: "+681", format: "XX XX XX", maxLength: 6 },
  { code: "ZM", name: "Zâmbia", dial_code: "+260", format: "XX XXX XXXX", maxLength: 9 },
  { code: "ZW", name: "Zimbábue", dial_code: "+263", format: "XX XXX XXXX", maxLength: 9 },
];

// Ordenar alfabeticamente
export const countries = [...allCountries].sort((a, b) => a.name.localeCompare(b.name));

interface CountrySelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  className?: string;
}

export function CountrySelector({
  selectedCountry,
  onSelectCountry,
  className,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dial_code.includes(searchQuery)
  );

  const handleSelectCountry = (country: Country) => {
    onSelectCountry(country);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Função para obter URL da bandeira usando flagcdn
  const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-3 pr-2 bg-transparent text-white hover:opacity-80 transition-opacity cursor-pointer"
      >
        <img 
          src={getFlagUrl(selectedCountry.code)} 
          alt={selectedCountry.name}
          className="w-6 h-4 object-cover rounded-sm"
        />
        <ChevronDown className="h-4 w-4 text-white/70" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay sem blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />

            {/* Modal responsivo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
                "w-[min(95vw,380px)] sm:w-[420px] md:w-[520px]",
                "max-h-[80vh] sm:max-h-[500px]",
                "rounded-xl sm:rounded-2xl border border-white/30",
                "bg-black/55 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]",
                "overflow-hidden"
              )}
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            >
              {/* Header com busca */}
              <div className="p-3 sm:p-4 border-b border-white/10 bg-white/5">
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar país..."
                    className={cn(
                      "w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5",
                      "bg-white/10 border border-white/20 rounded-lg",
                      "text-white placeholder:text-white/40",
                      "focus:outline-none focus:border-white/40",
                      "text-xs sm:text-sm backdrop-blur-sm"
                    )}
                    autoFocus
                  />
                </div>
              </div>

              {/* Lista de países */}
              <div className="overflow-y-auto max-h-[calc(80vh-80px)] sm:max-h-96 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleSelectCountry(country)}
                      className={cn(
                        "w-full flex items-center gap-2 sm:gap-3",
                        "px-3 sm:px-4 py-2.5 sm:py-3",
                        "text-left hover:bg-white/15 active:bg-white/20",
                        "transition-all duration-200 cursor-pointer backdrop-blur-sm",
                        selectedCountry.code === country.code && "bg-white/10"
                      )}
                    >
                      <img 
                        src={getFlagUrl(country.code)} 
                        alt={country.name}
                        className="w-6 h-4 sm:w-8 sm:h-6 object-cover rounded-sm shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-white font-medium truncate">{country.name}</div>
                        <div className="text-[10px] sm:text-xs text-white/60">{country.dial_code}</div>
                      </div>
                      {selectedCountry.code === country.code && (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-white/50 text-xs sm:text-sm">
                    Nenhum país encontrado
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { Country };
