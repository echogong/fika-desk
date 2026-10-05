#!/usr/bin/env python3
"""设置向导用的伪终端：在伪终端里运行一条命令，把它的输入输出原样转给服务端。

用法：pty-helper.py <列数> <行数> <命令> [参数…]
文件描述符 3（可选）：每行 "列数 行数"，用来调整终端大小。
命令退出后，用它的退出码退出；收到 SIGTERM 时让命令挂断。
只用 Python 自带的模块，服务器上有 python3 就行，不用另装东西。
"""
import fcntl
import os
import pty
import select
import signal
import struct
import sys
import termios


def set_size(fd, cols, rows):
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', rows, cols, 0, 0))


def write_all(fd, data):
    while data:
        data = data[os.write(fd, data):]


def main():
    cols, rows = int(sys.argv[1]), int(sys.argv[2])
    command = sys.argv[3:]
    pid, master = pty.fork()
    if pid == 0:
        try:
            set_size(1, cols, rows)
            os.execvp(command[0], command)
        except OSError as error:
            sys.stderr.write('启动不了 %s：%s\r\n' % (command[0], error.strerror))
        os._exit(127)

    def hang_up(*_):
        try:
            os.killpg(pid, signal.SIGHUP)
        except OSError:
            pass

    signal.signal(signal.SIGTERM, hang_up)
    signal.signal(signal.SIGHUP, hang_up)

    try:
        os.fstat(3)
        control = 3
    except OSError:
        control = None
    inputs = [0, master] + ([control] if control is not None else [])
    pending = b''
    while True:
        try:
            ready, _, _ = select.select(inputs, [], [])
        except InterruptedError:
            continue
        if master in ready:
            try:
                data = os.read(master, 65536)
            except OSError:
                data = b''
            if not data:
                break
            write_all(1, data)
        if 0 in ready:
            data = os.read(0, 65536)
            if data:
                write_all(master, data)
            else:
                # 服务端不要了：让命令挂断
                inputs.remove(0)
                hang_up()
        if control is not None and control in ready:
            chunk = os.read(control, 1024)
            if not chunk:
                inputs.remove(control)
                control = None
            else:
                pending += chunk
                while b'\n' in pending:
                    line, pending = pending.split(b'\n', 1)
                    try:
                        new_cols, new_rows = (int(x) for x in line.split())
                        set_size(master, new_cols, new_rows)
                    except (ValueError, OSError):
                        pass

    _, status = os.waitpid(pid, 0)
    if os.WIFEXITED(status):
        sys.exit(os.WEXITSTATUS(status))
    sys.exit(128 + os.WTERMSIG(status))


if __name__ == '__main__':
    main()
