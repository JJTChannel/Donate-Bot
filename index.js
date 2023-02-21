const Discord = require('discord.js');
const config = require('./config.json');
const colors = require("colors");
const axios = require("axios");
var use_webhook = true;

console.log("https://github.com/JJTChannel/Donate-Bot");

const client = new Discord.Client({
  intents: [
    1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536
  ],
  partials: ['CHANNEL']
});

//function ฟังก์ชัน
function send_log(color, status, reason, user, amount) {
  if (use_webhook) {
    let webhook = new Discord.WebhookClient({ url: config.webhook_log });
    let embed = new Discord.MessageEmbed()
      .setColor((color ? color : "#FF0000"))
      .setAuthor({ name: 'แจ้งเตือนการ โดเนท' })
      .setDescription('มีการโดเนทใหม่')
      .setThumbnail('https://cdn.discordapp.com/attachments/1071088361156124883/1076472811129937992/lv_0_20230218180046.gif')
    
      .setTimestamp()
      .setFooter({ text: 'JJTxStore - Donate Bot' });

    if (status == "success") {
      embed.addFields(
        { name: 'สถานะ', value: (status == "success" ? "สำเร็จ" : "ไม่สำเร็จ"), inline: true },
        { name: 'จำนวน', value: amount + "฿", inline: true },
        { name: 'ผู้ใช้งาน', value: `<@${user}>`, inline: true },    embed.setImage('https://cdn.discordapp.com/attachments/1071088361156124883/1077241997783474367/standard.gif')
      )

      webhook.send({
        content: "มีการแจ้งเตือนใหม่!",
        embeds: [embed]
      })
    } else {
      embed.addFields(
        { name: 'สถานะ', value: (status == "success" ? "สำเร็จ" : "ไม่สำเร็จ"), inline: true },
        { name: 'สาเหตุ', value: reason, inline: true },
        { name: 'ผู้ใช้งาน', value: `<@${user}>` },
        embed.setImage('https://cdn.discordapp.com/attachments/1071088361156124883/1077241997783474367/standard.gif')
      )

      webhook.send({
        content: "มีการแจ้งเตือนใหม่!",
        embeds: [embed]
      })
    }
  }
}
//รับข้อความ receive message
client.on("messageCreate", async (message) => {
  if (message.content == config.command) {
    if (message.author.id.includes(config.ownerID)) {
      const embed_donation = new Discord.MessageEmbed()
        .setTitle(config.shop_name + " | Donate ")

        .setDescription("**กดปุ่ม __Donate__ เพื่อสนับสนุนร้านเราและให้มีกำลังใจในการทำต่อ! **")
        .setColor('#ffffff')
        .setImage("https://cdn.discordapp.com/attachments/1071088361156124883/1077241997783474367/standard.gif")
      const row = new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton()
            .setCustomId('donate_button')
            .setLabel('Donate')
            .setEmoji('🧧')
            .setStyle('SUCCESS'),
        );

      message.channel.send({
        embeds: [embed_donation],
        components: [row]
      });
      message.delete();
    }
  }
})

//ready พร้อมทำงาน
client.on("ready", async () => {
  console.log(colors.green("Donation Manager | Ready!"));
  console.log("- JJTxStore - Donate BOT - ");
  console.log("");

  client.user.setActivity("Donate");
  require("./keep_alive");

  if (!config.phone || !Number(config.phone)) {
    console.log(colors.red("- เบอร์ผิด"))
  } else {
    console.log(colors.green("- เบอร์ถูก"))
  }
  try {
    new Discord.WebhookClient({ url: config.webhook_log })
    use_webhook = true;
    console.log(colors.green("- Webhook ถูก"))
  } catch (err) {
    if (err.code == "WEBHOOK_URL_INVALID") {
      console.log(colors.red("- webhook ผิด"))
      use_webhook = false;
    } else {
      console.log(colors.red("- มีบางอย่างผิดผลาดกับ webhook."))
    }
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId == "donate_button") {
    const modal_donation = new Discord.Modal()
      .setCustomId('donation_modal')
      .setTitle(config.shop_name + " | หน้าต่าง Donate");
    const link_gift = new Discord.TextInputComponent()
      .setCustomId('link_gift')
      .setLabel("ลิ้งค์ซองอังเปา 🧧")
      .setStyle('SHORT');
    const row = new Discord.MessageActionRow().addComponents(link_gift);
    modal_donation.addComponents(row);

    await interaction.showModal(modal_donation);
  }
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId == "donation_modal") {
    const link_gift = interaction.fields.getTextInputValue('link_gift');

    if (!link_gift || link_gift == "") {
      await interaction.reply({
        content: ":x: ซองไม่ถูกต้อง!",
        ephemeral: true
      })
    } else if (!config.phone || !Number(config.phone)) {
      await interaction.reply({
        content: ":x: ระบบถูกปิดใช้งานเนื่องจากเบอร์โทรศัพท์ที่ตั้งค่าไว้ไม่ถูกต้อง!",
        ephemeral: true
      })
    } else {
      axios.get("https://zamex-hub.000webhostapp.com/index.php?phone=" + config.phone + "&link=" + link_gift)
        .then(async (response) => {
          let data = response.data;
          if (data.reason == "VOUCHER_NOT_FOUND") {
            await interaction.reply({
              content: ":x: ซองของขวัญไม่ถูกต้อง!",
              ephemeral: true
            })
            send_log(null, "failed", "ซองของขวัญไม่ถูกต้อง", interaction.user.id);
          } else if (data.reason == "VOUCHER_OUT_OF_STOCK") {
            await interaction.reply({
              content: ":x: ซองของขวัญถูกใช้งานไปแล้ว!",
              ephemeral: true
            })
            send_log(null, "failed", "ซองของขวัญถูกใช้งานไปแล้ว", interaction.user.id);
          } else if (data.reason == "VOUCHER_EXPIRED") {
            await interaction.reply({
              content: ":x: ซองของขวัญหมดอายุแล้ว!",
              ephemeral: true
            })
            send_log(null, "failed", "ซองของขวัญหมดอายุ", interaction.user.id);
          } else if (data.reason == "CANNOT_GET_OWN_VOUCHER") {
            await interaction.reply({
              content: ":x: คุณไม่สามารถรับตังของตัวเองได้!",
              ephemeral: true
            })
            send_log(null, "failed", "คุณไม่สามารถรับตังของตัวเองได้!", interaction.user.id);
          } else if (data.status == "SUCCESS") {
            await interaction.reply({
              content: ":white_check_mark: โดเนทสำเร็จจำนวน " + data['amount'] + " ขอบคุณที่โดเนทให้กับทางเรานะครับ\n\n- " + config.shop_name,
              ephemeral: true
            })
            interaction.member.roles.add(config.role_donateid)
              .then(async () => { }).catch(async () => { });

            send_log("#00FF00", "success", null, interaction.user.id, data['amount']);
          } else {
            console.log(data.reason)
            await interaction.reply({
              content: ":x: ระบบมีปัญหากรุณาลองใหม่อีกครั้งในภายหลัง!",
              ephemeral: true
            })
            send_log(null, "failed", "มีปัญหาระหว่างการเติมเงิน!", interaction.user.id);
          }
        })
        .catch(async (error) => {
          console.log(error)
          await interaction.reply({
            content: ":x: ระบบมีปัญหากรุณาลองใหม่อีกครั้งในภายหลัง!",
            ephemeral: true
          })
          send_log(null, "failed", "มีปัญหาระหว่างการเติมเงิน!", interaction.user.id);
        });
    }
  }
})

client.login(config.token || process.env.TOKEN || process.env.token).catch(err => {
  console.log(colors.red("Donation Bot | Error"));
  console.log(colors.red(err.name + " " + err.message));
});
