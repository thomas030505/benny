/**
 * Ordliste: faguttrykk og koder som dukker opp i svarene, forklart for folk som ikke jobber med bygg.
 * Forklaringene er generelle og skrevet for hånd. De er ikke hentet fra dokumentene.
 *
 * `re` er et regulært uttrykk uten flagg. `cs: true` betyr at store og små bokstaver må stemme,
 * slik at «BRA» (bruksareal) ikke slår til på ordet «bra».
 */
export type Term = { h: string; p: string; re: string; cs?: boolean };

export const GLOSSARY: Term[] = [
  // Penger og kontrakt
  {
    h: "P85",
    re: "P85",
    cs: true,
    p: "Et kostnadsanslag med 85 prosent sannsynlighet for at prosjektet ikke blir dyrere. Kommunen bruker P85 som kostnadsramme, altså det øverste beløpet som er bevilget.",
  },
  {
    h: "P50",
    re: "P50",
    cs: true,
    p: "Et kostnadsanslag der det er like sannsynlig at prosjektet blir billigere som dyrere. P50 er det prosjektet styrer etter, mens P85 er rammen med reserve.",
  },
  {
    h: "Kostnadsramme",
    re: "kostnadsramme\\p{L}*|investeringsramme\\p{L}*",
    p: "Det høyeste beløpet politikerne har bevilget til prosjektet. Rammen dekker mer enn byggekontrakten: også merverdiavgift, prosjektering, byggherrens egne kostnader og en reserve for usikkerhet.",
  },
  {
    h: "Totalentreprise",
    re: "totalentreprise\\p{L}*",
    p: "En kontrakt der entreprenøren har ansvaret for både å prosjektere (tegne og beregne) og å bygge. Byggherren har én part å forholde seg til.",
  },
  {
    h: "Samhandling",
    re: "samhandlingsperiode\\p{L}*|samhandlingsfase\\p{L}*|samhandling\\p{L}*",
    p: "En første fase der byggherren og entreprenøren utvikler løsningene sammen før pris og endelig kontrakt blir satt. Målet er færre overraskelser når byggingen starter.",
  },
  {
    h: "Intensjonsavtale",
    re: "intensjonsavtale\\p{L}*",
    p: "En avtale om at partene har til hensikt å inngå en endelig kontrakt senere. Den binder ikke på samme måte som byggekontrakten.",
  },
  {
    h: "Investeringstilskudd fra Husbanken",
    re: "investeringstilskudd\\p{L}*|Husbanken",
    p: "Et statlig tilskudd kommunene får for å bygge sykehjemsplasser og omsorgsboliger. Husbanken forvalter ordningen.",
  },
  {
    h: "Merverdiavgiftskompensasjon",
    re: "merverdiavgiftskompensasjon\\p{L}*|mva\\.?-kompensasjon\\p{L}*|momskompensasjon\\p{L}*",
    p: "Kommuner får tilbake merverdiavgiften de betaler på bygg og tjenester. Derfor regnes den som en del av finansieringen.",
  },

  // Byggesak
  {
    h: "Rammetillatelse",
    re: "rammetillatelse\\p{L}*|rammesøknad\\p{L}*",
    p: "Første trinn i en byggesøknad. Kommunen godkjenner de ytre rammene, som plassering, høyde og bruk. Byggingen kan ikke starte før igangsettingstillatelsen også er gitt.",
  },
  {
    h: "Igangsettingstillatelse",
    re: "igangsettingstillatelse\\p{L}*|igangsetting\\p{L}*",
    p: "Tillatelsen som må være på plass før arbeidene på byggeplassen kan starte. Den kommer etter rammetillatelsen.",
  },
  {
    h: "Brukstillatelse",
    re: "brukstillatelse\\p{L}*",
    p: "Kommunens tillatelse til å ta bygget i bruk. Den kan gis midlertidig mens mindre arbeider gjenstår, før ferdigattesten kommer.",
  },
  {
    h: "Ferdigattest",
    re: "ferdigattest\\p{L}*",
    p: "Kommunens endelige bekreftelse på at bygget er ferdig og bygget slik tillatelsen sier.",
  },
  {
    h: "Rekkefølgekrav",
    re: "rekkefølgekrav\\p{L}*|rekkefølgebestemmelse\\p{L}*",
    p: "Krav i reguleringsplanen om at noe må være på plass før noe annet kan skje, for eksempel at et fortau må være bygget før bygget tas i bruk.",
  },
  {
    h: "Detaljregulering",
    re: "detaljregulering\\p{L}*|reguleringsplan\\p{L}*",
    p: "En juridisk bindende plan som bestemmer hva et avgrenset område kan brukes til, og hvor stort og høyt det kan bygges. Den består av et plankart og bestemmelser.",
  },
  {
    h: "Feltnavn i plankartet",
    re: "o_[A-ZÆØÅ]+\\d*",
    cs: true,
    p: "Koden er navnet på et felt i plankartet. «o_» foran betyr at arealet er offentlig. Bokstavene sier hva feltet brukes til, for eksempel parkering, torg eller vei. Åpne plankartet for å se hvor feltet ligger.",
  },
  {
    h: "Bestemmelsesområde",
    re: "#\\d+|bestemmelsesområde\\p{L}*",
    p: "Et avgrenset område i plankartet, merket med # og et tall, der det gjelder egne bestemmelser i tillegg til de vanlige.",
  },
  {
    h: "U1 og U2",
    re: "U1|U2",
    cs: true,
    p: "Underetasjene i bygget. U1 er første etasje under bakken og U2 er den nederste.",
  },

  // Areal og høyde
  {
    h: "BYA",
    re: "BYA",
    cs: true,
    p: "Bebygd areal: hvor stor flate bygget dekker på bakken, altså fotavtrykket.",
  },
  {
    h: "BRA",
    re: "BRA",
    cs: true,
    p: "Bruksareal: arealet innenfor ytterveggene, summert for alle etasjer.",
  },
  {
    h: "BTA",
    re: "BTA",
    cs: true,
    p: "Bruttoareal: arealet av alle etasjer målt til utsiden av ytterveggene. BTA er derfor litt større enn BRA.",
  },
  {
    h: "Dekar (daa)",
    re: "daa|dekar",
    p: "Et flatemål. Ett dekar er 1000 kvadratmeter.",
  },
  {
    h: "Kote",
    re: "kotehøyde\\p{L}*|kote",
    p: "Høyde over havet, oppgitt i meter. «Kote +140» betyr 140 meter over havet.",
  },

  // Støy og trafikk
  {
    h: "Lden",
    re: "L\\s?den",
    cs: true,
    p: "Et mål på gjennomsnittlig støy over hele døgnet, der støy om kvelden og natten teller ekstra fordi den plager mer.",
  },
  {
    h: "Desibel (dB)",
    re: "dB|desibel",
    cs: true,
    p: "Måleenheten for lydnivå. En økning på 10 dB oppleves omtrent som en dobling av lyden.",
  },
  {
    h: "Gul støysone",
    re: "gul\\p{L}* støysone\\p{L}*|gul sone",
    p: "Et område der støyen er så høy at boliger og institusjoner bare kan bygges hvis det gjøres tiltak, for eksempel en stille side eller skjerming.",
  },
  {
    h: "Stille side",
    re: "stille side",
    p: "En side av bygget der støyen er under grenseverdien, slik at beboerne kan lufte og sove mot den.",
  },
  {
    h: "Dempet fasade",
    re: "dempet fasade",
    p: "En fasade med tiltak, for eksempel innglassing eller skjerm, som senker støyen utenfor vinduet. Brukes når rommet ikke kan få en stille side.",
  },
  {
    h: "T-1442",
    re: "T-1442(?:/\\d{4})?",
    p: "Statens retningslinje for hvordan støy skal håndteres i arealplaner. Den setter grenseverdier for støy ved boliger og institusjoner, og for bygge- og anleggsstøy.",
  },
  {
    h: "T-1520",
    re: "T-1520",
    p: "Statens retningslinje for luftkvalitet i arealplanlegging.",
  },
  {
    h: "ÅDT",
    re: "ÅDT|årsdøgntrafikk\\p{L}*",
    p: "Årsdøgntrafikk: hvor mange kjøretøy som i gjennomsnitt passerer et punkt per døgn, regnet over hele året.",
  },

  // Grunn, vann og brann
  {
    h: "Kvikkleire",
    re: "kvikkleire\\p{L}*",
    p: "Leire som kan miste fastheten og bli flytende hvis den blir overbelastet eller forstyrret. Den kan utløse store skred, og derfor kartlegges den alltid før bygging.",
  },
  {
    h: "Masseutskifting",
    re: "masseutskift\\p{L}*",
    p: "Dårlige masser i grunnen, for eksempel torv, graves bort og erstattes med masser som tåler vekten av bygget.",
  },
  {
    h: "Overvann",
    re: "overvann\\p{L}*",
    p: "Regn og smeltevann som renner av fra tak, veier og andre tette flater.",
  },
  {
    h: "Fordrøyning",
    re: "fordrøy\\p{L}*",
    p: "Å holde overvannet tilbake i et magasin eller regnbed og slippe det ut sakte, slik at rørene ikke blir overbelastet ved kraftig regn.",
  },
  {
    h: "Flomvei",
    re: "flomve[ig]\\p{L}*",
    p: "Traseen vannet følger på overflaten når rørene er fulle. Den må holdes åpen så vannet ikke gjør skade på bygg.",
  },
  {
    h: "Blågrønn faktor",
    re: "blågrønn\\p{L}* faktor|blågrønnfaktor\\p{L}*",
    p: "Et tall som viser hvor mye vann og vegetasjon uteområdene har. Høyere tall betyr mer grønt og bedre håndtering av regnvann.",
  },
  {
    h: "VA",
    re: "VA-plan\\p{L}*|VA",
    cs: true,
    p: "Vann og avløp: ledningene for drikkevann, spillvann og overvann.",
  },
  {
    h: "DN",
    re: "DN\\s?\\d{2,4}",
    cs: true,
    p: "Rørdimensjon. Tallet er rørets nominelle diameter i millimeter, så DN150 er et rør på omtrent 150 mm.",
  },
  {
    h: "Brannklasse",
    re: "brannklasse\\p{L}*",
    p: "Bygg deles i brannklasse 1 til 4 etter hvor alvorlige følgene av en brann kan bli. Klassen styrer blant annet hvor lenge bæresystemet må tåle brann.",
  },
  {
    h: "Risikoklasse",
    re: "risikoklasse\\p{L}*",
    p: "Bygg deles i risikoklasse 1 til 6 etter hvordan de brukes. Sykehjem er i klasse 6, fordi beboerne trenger hjelp til å komme seg ut.",
  },
  {
    h: "ROS-analyse",
    re: "ROS-analyse\\p{L}*",
    p: "Risiko- og sårbarhetsanalyse: en gjennomgang av hva som kan gå galt på tomta, for eksempel flom, skred eller forurensning, og hva som må gjøres med det.",
  },

  // Miljø
  {
    h: "BREEAM-NOR",
    re: "BREEAM(?:[- ]NOR)?(?: Very Good)?",
    p: "En miljøsertifisering for bygg. Bygget får poeng for blant annet energi, materialer og inneklima, og havner på ett av fem nivåer: Pass, Good, Very Good, Excellent eller Outstanding.",
  },
  {
    h: "Passivhus",
    re: "passivhus\\p{L}*",
    p: "Et bygg som bruker svært lite energi til oppvarming, fordi det er godt isolert, tett og gjenvinner varmen i ventilasjonsluften.",
  },
  {
    h: "Utslippsfri byggeplass",
    re: "utslippsfri\\p{L}*",
    p: "En byggeplass der maskiner og oppvarming går på strøm eller hydrogen, uten eksos. Det er strengere enn fossilfri.",
  },
  {
    h: "Fossilfri byggeplass",
    re: "fossilfri\\p{L}*",
    p: "En byggeplass uten fossilt drivstoff. Maskinene kan gå på biodrivstoff, så det er fortsatt eksos, men ikke fra olje og diesel.",
  },
  {
    h: "Klimagassregnskap",
    re: "klimagassregnskap\\p{L}*|klimagassbudsjett\\p{L}*|klimaregnskap\\p{L}*",
    p: "En beregning av utslippene bygget gir gjennom hele levetiden: materialer, bygging, drift og transport. Budsjettet lages før bygging, regnskapet viser hva det faktisk ble.",
  },
  {
    h: "CO2e",
    re: "CO2e|CO2-ekvivalent\\p{L}*",
    p: "CO2-ekvivalenter. Alle klimagasser regnes om til den mengden CO2 som gir samme oppvarming, slik at de kan legges sammen.",
  },
  {
    h: "Ombrukskartlegging",
    re: "ombrukskartleg\\p{L}*",
    p: "En gjennomgang av bygg som skal rives, for å finne materialer og deler som kan brukes om igjen i stedet for å bli avfall.",
  },
  {
    h: "Miljøoppfølgingsplan",
    re: "miljøoppfølgingsplan\\p{L}*",
    p: "En plan som viser hvilke miljømål prosjektet har, og hvordan de skal følges opp gjennom prosjektering og bygging.",
  },

  // Bygget
  {
    h: "Sansehage",
    re: "sansehage\\p{L}*",
    p: "En skjermet hage som er laget for å stimulere sansene med planter, lukter, lyder og trygge gangveier. Den brukes særlig for personer med demens.",
  },
  {
    h: "Sonekontor",
    re: "sonekontor\\p{L}*",
    p: "Basen for hjemmetjenesten i en bydel. De ansatte møter der og reiser ut til brukerne derfra.",
  },
  {
    h: "Beskyttelsesrom",
    re: "beskyttelsesrom\\p{L}*|tilfluktsrom\\p{L}*|dekningsrom\\p{L}*",
    p: "Et rom som skal beskytte sivile ved krig eller andre alvorlige hendelser. Det brukes til noe annet til daglig, her som parkeringskjeller.",
  },
  {
    h: "Kulvert",
    re: "kulvert\\p{L}*",
    p: "En gang eller kanal under bakken som forbinder to bygg eller fører noe under en vei.",
  },
];

const SRC = GLOSSARY.map((t) => `(${t.re})`).join("|");

export type Piece = string | { term: Term; text: string };

/**
 * Deler en tekst i vanlige biter og faguttrykk. Hvert uttrykk markeres bare første gang
 * (`seen` deles mellom bitene i samme svar), så svaret ikke blir fullt av lenker.
 */
export function splitTerms(text: string, seen: Set<string>): Piece[] {
  const out: Piece[] = [];
  const re = new RegExp(`(?<![\\p{L}\\d_])(?:${SRC})(?![\\p{L}\\d])`, "giu");
  let at = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.slice(1).findIndex((g) => g !== undefined);
    const term = GLOSSARY[idx];
    if (!term || seen.has(term.h)) continue;
    if (term.cs && !new RegExp(`^(?:${term.re})$`, "u").test(m[0])) continue;
    const i = m.index ?? 0;
    if (i > at) out.push(text.slice(at, i));
    out.push({ term, text: m[0] });
    seen.add(term.h);
    at = i + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}
