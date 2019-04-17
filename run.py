from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import ssl

httpd = HTTPServer(('', 80), SimpleHTTPRequestHandler)

httpd.socket = ssl.wrap_socket (httpd.socket,
certfile='../server.pem', server_side=True)

httpd.serve_forever()