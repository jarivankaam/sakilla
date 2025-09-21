# Express Staff Server

Dit project is een moderne **Express server** opgezet volgens de **MVC-architectuur**. Het systeem maakt gebruik van duidelijke lagen:

* **Controllers**: verwerken HTTP-verzoeken en sturen responses terug.
* **Services**: bevatten de businesslogica en validatie.
* **DAOs (Data Access Objects)**: regelen alle communicatie met de database.

Met dit design kunnen **CRUD-operaties** eenvoudig worden uitgevoerd voor *staff*-leden.
Authenticatie wordt verzorgd door **express-session**, wat zorgt voor veilige, sessiegebaseerde login en logout.
Voor kwaliteit en betrouwbaarheid zijn **Jest** en **SuperTest** geïntegreerd, zodat zowel unit- als integratietests uitgevoerd kunnen worden.

Kortom: een schaalbare en testbare server, ideaal als basis voor verdere uitbreiding.
