import { EmbedBuilder, type Message } from 'discord.js';

export const help = async (message: Message) => {
  const userAvatar = message.author.avatarURL() ?? undefined;

  const embed = new EmbedBuilder()
    .setTitle('<:Weird:1243163283234492507> CwelBet - Komendy')
    .setColor('#C200FF')
    .setFooter({
      text: message.author.displayName,
      iconURL: userAvatar,
    })
    .setDescription(
      '**!szekle <:zyd:1149450085210542180> ** - Wyświetla ranking szekli użytkowników.\n\n**!odbierz <:dawid:1061447249097408653> ** - Pozwala odebrać bonus w postaci losowej liczby szekli, która mieści się w zakresie `od 100 do 500`. Możesz odebrać bonus co `6 godzin`.\n\n**!duel <:cipek:1238944101840191669> ** - Pozwala wyzwać innego użytkownika na pojedynek, w którym stawką są szekle. Użyj tej komendy wraz z tagiem użytkownika i ilością szekli jako argumentami, np. `!duel @cwel 200`.\n\n**!mecze <:baza2:1207789466865901638> ** - Wyświetla listę meczy z fortuny w czasie rzeczywistym, zawiera drużyny, wynik, kursy oraz czas meczu.\n\n**!bet `id_meczu` `nazwa_drużyny` `ilość szekli` <:wave2:1228441413348491385> ** -To polecenie pozwala Ci obstawić wynik meczu z tabeli `!mecze`. Wystarczy podać identyfikator meczu `(id_meczu)`, wybrać drużynę, na którą chcesz postawić `(nazwa_drużyny)`, oraz określić ilość szekli `(ilość szekli)`, którą chcesz postawić. Na koniec kliknij zielony przycisk, aby potwierdzić swoją stawkę!'
    )
    .setTimestamp();
  await message.channel.send({ embeds: [embed] });
};
