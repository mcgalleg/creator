/**
 * Script to update post thumbnails from Apify data
 * Run with: npx tsx scripts/update-thumbnails.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Define just what we need from the schema
const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  tiktokId: text("tiktok_id").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  updatedAt: timestamp("updated_at"),
});

// Create db connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Helper to extract TikTok video ID from URL
function extractVideoId(url: string): string {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : "";
}

// Thumbnail data from Apify sync (webVideoUrl -> coverUrl)
const rawData = [
  { url: "https://www.tiktok.com/@alonderzz/video/7571176090647989535", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oQUGOEIwIAfZQVLAkdhAgcNezeKGF3RSkQQOUf~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=wlXbRbfQtQtM6qvOjQaUtJlqvwU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7517082026093137183", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oYB3ACdKAiBAKCQAE0iB1lfWIAFJAU1wiKSotI~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=l6Juect0%2BptiuNzniOXNLV8nCWI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7530064674184826142", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oUVCgxDAECuDW22SAAARf7fnEAEFAUEoAIuQbt~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=a3WXG1KR0iXYwnUyuhBwoDThrpc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7601726390102281503", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oMLOe21lfA8bQpRWIH5YHGBFUf7eggcERPYAgG~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=8pbdIqdcDrCkX8hnrglLWxcUt1g%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7601565731884420382", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/okrIaX5eQeSRUtfF68LGeQiGOXALV7FAChblQa~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=yUbLh%2Fgl9q8eskqHnmEZhZRomKA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7600989619332582686", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/osSDoEXiAjBnIN0dvaFER6rAI9A8iIVwYGAPB~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=I%2FJTce89nmSPlgZR3IBF%2FxnsLKU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7600551512095378718", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/og3W6Ac1UKAPhiI0BvifiBA9MlpAqYEVIABwCx~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=1V0l%2BKK7i9%2BP4fH8ny3abCF4FTs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7599845090617543966", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oQZWEIAFfIa8VjJAEIIetEIBMKHGDfTCqZqSJ4~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=eEDRE8P4hKQfZ54QRLWrrEotFh8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7597650042979208479", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/o4AELpewD0pIfBOBspDEMIYtVcRREOFA7BxEwi~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=GOLDTxpmFEKsavGUTQtDrF8s2YQ%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7595662718883990815", cover: "https://p19-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/ogpmpAiwIRVkz2BAiVHWSNaITB1BuILv5IEok~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=2c8YFlGNuSVaWNOPnAtNVQ5sS80%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7595427034944343326", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/o8N3wM0PGQzYsQfCAhLgq9jjACefSCIQIQADI0~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=p7Y6M1GSl3Hsryz9DgFBmroJRBU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7594282054485839134", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/owA5avCFIiWBRAJTZR2rokUVBLVEyYPB9EIVi~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=lb88VggeRiqBI0%2F7g9I2hCfpMg8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7592817261946129694", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oggsCGVDpBGlYZrFERwxoAQ9EEtffXTAVRQyCM~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=iqYVneO1t5OLa0P0OXC%2BUEd0bGA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7592791433120156959", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oMQjRqSAg1B44jYfGIQfTvLS6GaCsAeXIAIN76~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=RWpuoXPjirJYIi4sTLgjcokbPR0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7592054405013261599", cover: "https://p19-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oEfREEVeNlZDBAqcL2CkIdnZAAFVEpAGXtDVAE~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=CxaCJHjRTY5YOBMw6ius6xIqzrI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7591632899124858142", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oAftQ0LJA9qzeg6rIAGAgvt7jWSAlEFIAcI8es~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=u%2BwY3J8OzX7Jxl07lcjM%2BPALGKM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7590256735080779039", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/owHsRgEHpQVoEBEzBBVFfyJEQJDDmpAvLAfLKz~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=23SfY5Kjysy2%2FO0qN0HFhHlHvx8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7590197279936498975", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-maliva-i-photomode-us/894a46e65c054df48464ed5b1c5259ef~tplv-photomode-image.jpeg?dr=10375&x-expires=1770170400&x-signature=%2BBZPWYOmJywcrwSeZwiBR8KtPOw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=9b759fb9&idc=no1a&ftpl=1" },
  { url: "https://www.tiktok.com/@alonderzz/video/7589883803812777247", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oAVIBqOKvL9qACqbPSeBjtA3qIQ1eIXGQpXlEe~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=eT3CAfHTLauysuqGXvcSCZTQ70c%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7589096721553149215", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oQHGcQqB0A4xa93iiBdPkAINCidRfq7A0II1lL~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=rWxzAKf8mrQ9Jn40B3kRSaKA8qs%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7587514260608027935", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oINSogIIEIASPimeeRLqMC5l5BUfmIAiGCIjHy~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=tsfvOQaGHriU5AlhqwoHDi4IZ4c%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7587240691831541023", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oEpF4EBsQfRVqdC18fuPWQ0qpomlKDjASgEAAE~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=KeoiY1o6xOso1sm1PV1C2ToyzRM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7586817189064215838", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-maliva-i-photomode-us/b835fac8c1a84e329e4b44e86c8a3bdb~tplv-photomode-image.jpeg?dr=10375&x-expires=1770170400&x-signature=lv%2BZ4fNdumpjSQi%2BvVlTqWFXwII%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=9b759fb9&idc=no1a&ftpl=1" },
  { url: "https://www.tiktok.com/@alonderzz/video/7586042842150096159", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/owjAeCIh8lGCjSAhHZRALAOIeCqgCSQIELQv9f~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=s82aVfF2q0Y%2FvAn5mNxk9zBBo24%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7584643960174398750", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/osSNgC3IAGI8LAefUEICeLYH4IqxlgoUjBhGUT~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=jvLU21IdCE6SycjzVRhTiQf9i9c%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7584187082474638622", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oUq8gZVDpBc9j8xFEfmGPAQ2EEdAfQvAURQhdA~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=uDpJL8zLN%2BNUOJgkALXnBwXctF0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7583835185033121055", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/owfHgBWeAj4aBBqATrADdesbEeAeRX4ZVre5YE~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=1kV6RF1Zv9NDqb%2FPl2rY27%2BM36o%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7582083244477205790", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/o0QGLJA5fRBA3BExIAAJIeKpUe4lkQAflQEGAy~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=HNaFXUUaqbaD8SdoY3axunnoZLE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7581600188838563102", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-maliva-i-photomode-us/2f563fcd86ca444382f63ce33aecd0d0~tplv-photomode-image.jpeg?dr=10375&x-expires=1770170400&x-signature=k5LAHr3QOiSaQWTAJOVHlK5PnnA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=9b759fb9&idc=no1a&ftpl=1" },
  { url: "https://www.tiktok.com/@alonderzz/video/7581303696722595102", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oMzGSIgBA8G5AOAPgfDICeMYYqLnjbXIhrR5e2~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=53zeyZHp9HE%2Bw%2F1T9qz3067V9tU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7579067693362433311", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/ogrcaqAQI1GAXqoLIGEoBSgPCARIjIAAIcf4ef~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=%2BAabC%2F1DePgUv4VOrbEH31uPRQc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7578272064042192158", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/o0E9mcREQEAfMQhWIpYA4UzNVBFwY3KD2If5xx~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=c289YdiNVxgXUoJ7BHZPnCHmk94%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7576096087950249247", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oE8jQIR7eENUJNCHcRCeQvTZAUXqISA2RfMqTQ~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=01LDt%2BhaRzxov5m%2BoYCldfTxhV0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7576091817561705758", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oInaO5bmBSAiP6rEuElWXjQSBaIYIrAR3MuiV~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=PGgbbYa6ZOJn%2BdK2goLEbDae5RU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7573882662394367263", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oYaE8AbEjlIPAPBRUHi1AwiWlvAATzEnAPsBR~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=fJUnsWf1IfcgjhOmrC7cSMev3s8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7573511711345446174", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oIIaIFEERhTGAjDp9FEkf1Ie1SvEvE7AVhoNB8~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=tjxNTCkXckzBUcc4j5ZhwIq2aLw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7569438236649557279", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oM96VUAVaEyBDAHrAOBAilcIGGBiPQSMjJRwI~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=fb%2BizCOXRf9bssnM1hS68gF4qzI%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7568584652856773919", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/o4aJvAB38IAQrBVXLUi5Ci8QIEAVBV2Rk13DQ~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=Cb0LSL6ElrqEE6YvWcL8Rj5k5TU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7567597940160613663", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oMfyEDDIS9FYEYXfEAtFzVpkggRJBAI7EIzBHq~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=ZyH%2Bj%2B9IW%2ByXwcnolTP13zp5L54%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7566079948977409310", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oIAAtEBepEA6HxujADCJAsQAFA2EVIfRaEWHAg~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=My2ndWWyh6Fqd5PcQom9s%2F5ooSo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7563821031585025311", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/ogzIsfB4tAvjB55IDu9iAfCqFIeiICwMRdRavL~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=KeHo9flzaqZ8Bj2hyjlo3lh69EY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7563478986538421534", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oAK2R3DWoEVAEAEz4CeigDAiIRBApsAbNAfdBD~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=vFqwjEeeJi5a69h2mpj9lHWkYVA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7561602593252805919", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/owAXAfx4BEDoiAXEGwiNB5EYeCVI0ykA02RIrA~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=Pahyxa3wFEVfGu4nwv2N6%2FXkDu0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7561102221727780127", cover: "https://p19-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oYTIpOL3cQGfDHAA0wAAeLIAR5gVjfQIqAgNuE~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=drJBMeuhPZWj5nkOXgKNp1Thgh0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7560892233239629087", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oIEnAoaCMUeiEriRkqIAvMAVYrAfd50tAD7E3B~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=EmtdVFntqQH%2Bh93kwScXmhRcFtg%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7559039440669216031", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oYfdYzmfxolLQAEXGGIFUE9DBhPw5QRno6VAOE~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=OagEfCPdLTratBCalVc3wRkTKhU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7558291205113597214", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oMyAOEIO8fGAjmAdPeAgLEIIehqAHRQI4cIBIk~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=RoH0bWsGrMMrVdXMDJJFo4kmtX4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7556436594488577310", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oQAg0L2FRiIxT3BdCaBKAVvbpE1NG37EBijIR~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=MTp2Lnvqd%2FJgfRcw6lGI1zsNOH0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7555312100059434271", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/ok3NZA3DaGqYnJlGAAXARDAzEYwciPBEBA1iI~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=2BS0oThW%2FANCIJLKddtSzBIf%2FJE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
  { url: "https://www.tiktok.com/@alonderzz/video/7553843071591451934", cover: "https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/o4A5avjQIiNBRADpaSF0BUDVBIAEYkjKpgINi~tplv-tiktokx-origin.image?dr=10395&x-expires=1770170400&x-signature=QXUBSP3NHN9r%2F0O1%2FP2gxgWfwPA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a" },
];

// Convert to tiktokId -> coverUrl map
const thumbnailData: Record<string, string> = {};
for (const item of rawData) {
  const id = extractVideoId(item.url);
  if (id && item.cover) {
    thumbnailData[id] = item.cover;
  }
}

async function updateThumbnails() {
  console.log("Starting thumbnail update...");
  console.log(`Processing ${Object.keys(thumbnailData).length} posts\n`);

  let updated = 0;
  let errors = 0;

  for (const [tiktokId, thumbnailUrl] of Object.entries(thumbnailData)) {
    try {
      await db
        .update(posts)
        .set({
          thumbnailUrl,
          updatedAt: new Date(),
        })
        .where(eq(posts.tiktokId, tiktokId));

      updated++;
      console.log(`Updated: ${tiktokId}`);
    } catch (error) {
      errors++;
      console.error(`Error updating ${tiktokId}:`, error);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
}

updateThumbnails()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
