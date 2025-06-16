import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from datetime import datetime
import mysql.connector
import re
import requests

from aiosend import CryptoPay
from aiosend.types import Invoice

# Замените 'YOUR_BOT_TOKEN' на токен вашего бота
TOKEN = '7525088605:AAETYE0FuhEehVKw_kClbb4LpJunFNFfdow'
cp = CryptoPay("415149:AAHydkesnNhGY4hUwuaNBn0FmRb87piJu46")
bot = telebot.TeleBot(TOKEN, threaded=True)
logs_id = 7471568341
status_list = ['pending','completed','rejected']


def check_withdraw(withdraw_id):
    # Параметры подключения
    config = {
    'host': '141.8.193.104',
    'user': 'a1131105_better',  # Имя пользователя базы данных
    'password': 'better89509517498',    # Пароль
    'database': 'a1131105_better' # Название базы данных
    }
    post = 0
    sum = 0
    print(f"{withdraw_id}")
    try:
        # Создаем подключение
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()

        # Выполняем запрос
        cursor.execute("SELECT * FROM withdrawals")
        
        # Получаем результаты
        results = cursor.fetchall()
        for row in results:
            id_user = row[1]
            summ = row[2]
            id_deposit = row[3]
            status = row[4]
            print(f"Заявка {id_deposit} на сумму {summ}")
            if id_deposit == withdraw_id:
                post = 1
                summ = summ
                id_user = id_user
                if status == status_list[1]:
                    post = 2
                elif status == status_list[2]:
                    post = 3
            else:
                print(f"Заявка {id_deposit}  не найдена!")
    except mysql.connector.Error as err:
        print("Ошибка:", err)
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
    return post, summ, id_user

def event_handler_withdraw(full_name, username, user_id, withdraw_id):
    # Получение текущей даты и времени
    post = check_withdraw(withdraw_id[1])
    price = post[1]
    id_user = post[2]
    now = datetime.now()
    formatted_time = now.strftime("%Y-%m-%d %H:%M:%S")
    id_deposit_user = withdraw_id[1].split("WDR_")
    text_user = (
        f"Операция мамонтом: Вывод\n\n"
        f"Имя мамонта: {full_name}\n"
        f"Сумма: {price}\n"
        f"Username: @{username}\n"
        f"ID мамонта (TG): {user_id}\n"
        f"ID мамонта (Cайт): {id_user}\n"
        f"ID операции: {withdraw_id[1]}\n"
        f"Дата: {formatted_time}"
                            )
    reply_text_success = (
        f"✅ Заявка на вывод\n"
        f"💤 Пожалуйста, ожидайте.\n"
        f"🔖 ID вывода: {id_deposit_user[1]}\n"
        f"⌛️ Дата: {formatted_time}"
    )
    reply_text_error = (
        f"Заявка не существует!\n"
        f"Пожалуйста, попробуйте снова.\n"
    )

    reply_text_error_return = (
        f"Заявка на вывод уже была выполнена!\n"
    )
    reply_text_error_cancel = (
        f"Заявка на вывод была отклонена!\n"
    )
    user_url = telebot.types.InlineKeyboardMarkup()
    button = telebot.types.InlineKeyboardButton("Одобрить вывод", callback_data=f'accept_w-{user_id}')
    button1 = telebot.types.InlineKeyboardButton("Мамонт ➔", callback_data='*', url=f'tg://user?id={user_id}')
    user_url.add(button1)
    user_url.add(button)
    print(f"ответ {post}")
    if post[0] == 0:
        bot.send_message(chat_id=user_id, text=reply_text_error)
    elif post[0] == 1:
        # Запрашиваем сумму для вывода
        markup = telebot.types.InlineKeyboardMarkup()
        button1 = telebot.types.InlineKeyboardButton("Вывод на карту", callback_data='withdraw_card')
        button2 = telebot.types.InlineKeyboardButton("Вывод по СБП", callback_data='withdraw_spb')
        markup.add(button1, button2)
        bot.send_message(user_id, "Выберите способ вывода:", reply_markup=markup)
        # bot.send_message(chat_id=logs_id, text=text_user, reply_markup=user_url)
        # bot.send_message(chat_id=user_id, text=reply_text_success)
    elif post[0] == 2:
        bot.send_message(chat_id=user_id, text=reply_text_error_return)
    elif post[0] == 3:
        bot.send_message(chat_id=user_id, text=reply_text_error_cancel)
    else:
        print("Какая-то хуйня")

def check_deposit(deposit_id):
    # Параметры подключения
    config = {
    'host': '141.8.193.104',
    'user': 'a1131105_better',  # Имя пользователя базы данных
    'password': 'better89509517498',    # Пароль
    'database': 'a1131105_better' # Название базы данных
    }
    post = 0
    sum = 0
    print(f"{deposit_id}")
    try:
        # Создаем подключение
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()

        # Выполняем запрос
        cursor.execute("SELECT * FROM deposits")
        
        # Получаем результаты
        results = cursor.fetchall() 
        for row in results:
            id_user = row[1]
            summ = row[2]
            id_deposit = row[3]
            status = row[4]
            print(f"Заявка {id_deposit} на сумму {summ}")
            if id_deposit == deposit_id:
                post = 1
                summ = summ
                id_user = id_user

            else:
                print(f"Заявка {id_deposit}  не найдена!")
    except mysql.connector.Error as err:
        print("Ошибка:", err)
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
    return post, summ, id_user

def event_handler_deposit(full_name, username, user_id, deposit_id):
    # Получение текущей даты и времени
    post = check_deposit(deposit_id[1])
    price = post[1]
    id_user = post[2]
    now = datetime.now()
    #Курс доллара
    response = requests.get('https://api.exchangerate-api.com/v4/latest/USD')
    data = response.json()
    usd_to_rub = data['rates']['RUB']
    deposit_usd = float(price) / float(usd_to_rub)
    print(f"Курс USD {usd_to_rub} / К оплате {deposit_usd}")
    formatted_time = now.strftime("%Y-%m-%d %H:%M:%S")
    id_deposit_user = deposit_id[1].split("DEP_")
    text_user = (
        f"Операция мамонтом: Пополнение\n\n"
        f"Имя мамонта: {full_name}\n"
        f"Сумма: {price} ({deposit_usd}$)\n"
        f"Username: @{username}\n"
        f"ID мамонта (TG): {user_id}\n"
        f"ID мамонта (Cайт): {id_user}\n"
        f"ID операции: {deposit_id[1]}\n"
        f"Дата: {formatted_time}"
                            )
    reply_text_success = (
        f"✅ Заявка на пополнение.\n"
        f"⌛️ Дата: {formatted_time}"
    )
    reply_text_error = (
        f"Заявка не существует!\n"
        f"Пожалуйста, попробуйте снова.\n"
    )


    invoice = cp.create_invoice(deposit_usd, "USDT")
    deposit = telebot.types.InlineKeyboardMarkup()
    url_payment_u = f'{invoice.mini_app_invoice_url}'
    print(f'{url_payment_u}')
    url_payment = url_payment_u.replace("https://t.me/CryptoBot/app?startapp=invoice-", "")
    print(f'{url_payment}')
    button = telebot.types.InlineKeyboardButton("Перейти к оплате", callback_data='*', url=f'https://t.me/CryptoBot?start={url_payment}')
    invoice.poll(user_id=user_id, deposit_id=deposit_id, id_user=id_user, summ=price)
    deposit.add(button)
    user_url = telebot.types.InlineKeyboardMarkup()
    # button = telebot.types.InlineKeyboardButton("Одобрить пополнение", callback_data=f'accept_d {user_id} {price} {id_user} {deposit_id}')
    button1= telebot.types.InlineKeyboardButton("Мамонт ➔", callback_data='*', url=f'tg://user?id={user_id}')
    user_url.add(button)
    user_url.add(button1)
    print(f"ответ {post}")
    if post[0] == 1:
        bot.send_message(chat_id=logs_id, text=text_user, reply_markup=user_url)
        bot.send_message(chat_id=user_id, text=reply_text_success, reply_markup=deposit)
    elif post[0] == 0:
        bot.send_message(chat_id=user_id, text=reply_text_error)
    elif post[0] == 2:
        bot.send_message(chat_id=user_id, text=reply_text_error_return)
    else:
        print("Какая-то хуйня")
# Статус меняем и пополняем
def deposit_add(summ, user, trans_id):
    config = {
    'host': '141.8.193.104',
    'user': 'a1131105_better',  # Имя пользователя базы данных
    'password': 'better89509517498',    # Пароль
    'database': 'a1131105_better' # Название базы данных
    }
    try:
        # Создаем подключение
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        transaction_id = trans_id[1]

        # Выполняем запрос
        # cursor.execute('''UPDATE deposits SET status = ? WHERE transaction_id = ?''', ('completed', transaction_id))
        # cursor.execute('''INSERT INTO transactions (user_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)''', ('25', '1501.00', 'deposit', 'Пополнение баланса', '2025-06-17 03:01:47'))

        sql_query = f"""INSERT INTO transactions (user_id, amount, type, description, created_at) VALUES ('{user}', '{summ}', 'deposit', 'Пополнение баланса {transaction_id}', NOW());"""
        cursor.execute(sql_query)
        sql_querys = f"""UPDATE users SET balance = balance + '{summ}' WHERE id = '{user}';"""
        cursor.execute(sql_querys)
        # cursor.execute(f'''INSERT INTO transactions (user_id, amount, type, description, created_at) VALUES ({user_id}, {summ}, 'deposit', f'Пополнение баланса {trans_id}',{formatted_time})''')
        connection.commit()
    except mysql.connector.Error as err:
        print("Ошибка:", err)
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@cp.invoice_polling()
def handle_payment(
    invoice: Invoice,
    user_id: int,
    deposit_id,
    id_user,
    summ,
) -> None:
    deposit = telebot.types.InlineKeyboardMarkup()
    button = telebot.types.InlineKeyboardButton("Перейти", callback_data='*', url='https://cs2rolls.ru')
    deposit.add(button)
    deposit_add(summ, id_user, deposit_id)
    reply_text_accept = (
    f"✅ Средства успешно зачислены на счет!\n")
    bot.send_message(user_id, reply_text_accept, reply_markup=deposit)
    bot.send_message(
        logs_id,
        f"Мамонт пополнил на: {invoice.amount} {invoice.asset} {deposit_id}",
    )

# Обработка любого текстового сообщения
@bot.message_handler(content_types=['text'])
def handle_text_message(message):
    chat_id = message.chat.id
    user = message.from_user
    name = user.first_name or ''
    last_name = user.last_name or ''
    username = user.username or 'Нет username'
    full_name = f"{name} {last_name}".strip()
    user_id = user.id
    message = message.text
    parts = message.split("/start")
    print(parts[0])
    transaction = parts[1]
    trans_type = transaction[:8]
    if trans_type == " deposit":
        deposit_id = parts[1].split("deposit_")
        event_handler_deposit(full_name, username, user_id, deposit_id)

    elif transaction[:8] == " withdra":
        deposit_id = parts[1].split("withdraw_")
        event_handler_withdraw(full_name, username, user_id, deposit_id)

@bot.callback_query_handler(func=lambda call: True)
def callback_query(call):
    if call.data == 'withdraw_card':
        number = bot.send_message(call.message.chat.id, "Введите номер карты для вывода:")
        bot.register_next_step_handler(call.message, process_withdraw, number_card, 'bank')
    elif call.data == 'withdraw_spb':
        number = bot.send_message(call.message.chat.id, "Введите номер телефона и банк для вывода:\nВ формате: +79001234567 Тбанк")
        bot.register_next_step_handler(call.message, process_withdraw, number_phone, 'wallet')
    data = call.data.split(' ')
    mamont_id = data[1]
    summ = data[2]
    user = data[3]
    deposit_id = data[4]
    elif data[0] == "accept_w":
        reply_text_accept_w = (
        f"✅ Заявка на вывод была одобрена!\n")
        bot.send_message(mamont_id, reply_text_accept_w)
    elif data[0] == "accept_d":
        deposit_s = telebot.types.InlineKeyboardMarkup()
        button = telebot.types.InlineKeyboardButton("Перейти", url='https://cs2rolls.ru')
        deposit_s.add(button)
        deposit_add(summ, user, deposit_id)
        reply_text_accept = (
    f"✅ Средства успешно зачислены на счет!\n")
        bot.send_message(mamont_id, reply_text_accept, reply_markup=deposit_s)
        
def process_withdraw(message, number, method):
    user_id = message.from_user.id
    sposob = ' '
    if method == 'bank':
        sposob = 'Вывод на карту'
    elif method == 'wallet':
        sposob = 'Вывод на номер по СБП'
    bot.send_message(user_id, f"✅ Заявка на вывод была отправлена!\n\n{sposob}\n\nОжидайте вывода средств в течении 24 часов.")

if __name__ == '__main__':
    cp.start_polling(bot.infinity_polling)
    bot.polling()